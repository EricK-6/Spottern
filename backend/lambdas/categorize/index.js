/**
 * Categorize Lambda.
 * Takes ingested transactions and sends the WHOLE statement to Claude
 * Opus 4.8 on Amazon Bedrock in a single call — whole-statement context is
 * what lets the model spot duplicates and out-of-pattern spend, not just
 * label merchants. The model's verdicts are merged back into the shared
 * Transaction schema (category, flagged, explanation, anomalyScore).
 *
 * Env vars:
 *   BEDROCK_MODEL_ID       - default au.anthropic.claude-opus-4-8 (Opus 4.8 in
 *                            ap-southeast-2 is inference-profile only; the au.
 *                            profile keeps inference in Australia)
 *   BEDROCK_REGION         - default ap-southeast-2
 *   TABLE_NAME             - optional: persist enriched records to DynamoDB
 *   NOTIFY_FUNCTION_NAME   - optional: invoke the notify Lambda with flagged records
 *
 * Deployment: bundle `@anthropic-ai/bedrock-sdk` (npm install in this folder,
 * zip together with ../../shared). IAM needs bedrock:InvokeModel on the
 * inference profile + foundation model, plus dynamodb:BatchWriteItem /
 * lambda:InvokeFunction when the optional stages are enabled.
 */

const { CATEGORIES } = require("../../shared/transaction-schema");
const { CORS_HEADERS, invokeNextLambda, parseEventBody } = require("../../shared/pipeline");

const SYSTEM_PROMPT = `You are the fraud and spend analysis engine for Spottern!, a tool that reviews New Zealand (BNZ) bank statements for everyday customers.

You receive one full statement as a JSON array of transactions. For EVERY transaction, decide:

1. "category" — exactly one of: ${CATEGORIES.join(", ")}.
2. "flagged" — true when the transaction is unusual or suspicious in the context of the whole statement. Watch especially for:
   - large purchases from overseas or foreign merchants,
   - duplicate charges (same merchant, same amount, same day),
   - vague or unidentifiable merchants with high amounts,
   - anything sharply out of pattern with the rest of the statement.
   Ordinary spend (groceries, salary, rent, utilities, small subscriptions) is NOT flagged.
3. "anomalyScore" — 0 to 1. Ordinary transactions score below 0.2; genuinely suspicious ones score above 0.7.
4. "explanation" — for flagged transactions only: 1-2 sentences a bank customer with no financial background can understand, saying what looks off and why. No jargon, no internal codes. For unflagged transactions return an empty string.

Return a verdict for every transactionId you were given, and no others.`;

/** Structured-output schema: guarantees parseable verdicts for every row. */
const RESULT_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          transactionId: { type: "string" },
          category: { type: "string", enum: CATEGORIES },
          flagged: { type: "boolean" },
          anomalyScore: { type: "number" },
          explanation: { type: "string" }
        },
        required: ["transactionId", "category", "flagged", "anomalyScore", "explanation"],
        additionalProperties: false
      }
    }
  },
  required: ["results"],
  additionalProperties: false
};

async function analyzeWithClaude(transactions) {
  // Lazy require so the merge logic below is unit-testable without the SDK.
  // Note: we use the classic bedrock-runtime client (AnthropicBedrock), not
  // AnthropicBedrockMantle — the uni org's service control policy explicitly
  // denies the bedrock-mantle endpoint, while classic InvokeModel is allowed.
  const { AnthropicBedrock } = require("@anthropic-ai/bedrock-sdk");
  const client = new AnthropicBedrock({
    awsRegion: process.env.BEDROCK_REGION || "ap-southeast-2"
  });

  // Only send what the model needs — keeps tokens down and avoids leaking
  // pipeline metadata into the prompt.
  const statement = transactions.map(t => ({
    transactionId: t.transactionId,
    date: t.date,
    merchant: t.merchant,
    amount: t.amount,
    direction: t.direction
  }));

  const response = await client.messages.create({
    model: process.env.BEDROCK_MODEL_ID || "au.anthropic.claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: RESULT_SCHEMA } },
    messages: [{ role: "user", content: JSON.stringify(statement) }]
  });

  const text = response.content.find(block => block.type === "text");
  if (!text) throw new Error(`Bedrock returned no text block (stop_reason: ${response.stop_reason})`);
  return JSON.parse(text.text).results;
}

/**
 * Merges model verdicts into the schema records. Defensive on purpose:
 * an unknown category, missing verdict, or out-of-range score must never
 * corrupt a record that downstream Lambdas and DynamoDB rely on.
 */
function mergeAnalysis(transactions, results) {
  const byId = new Map(results.map(r => [r.transactionId, r]));

  return transactions.map(t => {
    const verdict = byId.get(t.transactionId);
    if (!verdict) return { ...t, category: "uncategorized", anomalyScore: 0 };

    const category = CATEGORIES.includes(verdict.category) ? verdict.category : "uncategorized";
    const flagged = Boolean(verdict.flagged);
    const rawScore = Number(verdict.anomalyScore);
    const anomalyScore = Number.isFinite(rawScore) ? Math.min(1, Math.max(0, rawScore)) : 0;
    const explanation = flagged && verdict.explanation ? verdict.explanation.trim() : null;

    return { ...t, category, flagged, explanation, anomalyScore };
  });
}

async function persistTransactions(transactions) {
  const tableName = process.env.TABLE_NAME;
  if (!tableName) return false;

  const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
  const { DynamoDBDocumentClient, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  for (let i = 0; i < transactions.length; i += 25) {
    let requestItems = {
      [tableName]: transactions.slice(i, i + 25).map(t => ({ PutRequest: { Item: t } }))
    };
    // BatchWrite can partially succeed; retry the leftovers once.
    for (let attempt = 0; attempt < 2 && requestItems; attempt++) {
      const { UnprocessedItems } = await doc.send(new BatchWriteCommand({ RequestItems: requestItems }));
      requestItems = UnprocessedItems && Object.keys(UnprocessedItems).length ? UnprocessedItems : null;
    }
    if (requestItems) throw new Error("DynamoDB batch write left unprocessed items after retry");
  }
  return true;
}

exports.handler = async (event) => {
  try {
    const body = parseEventBody(event);
    const transactions = body.transactions;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error("Expected a { transactions: [...] } payload");
    }

    const results = await analyzeWithClaude(transactions);
    const enriched = mergeAnalysis(transactions, results);
    const persisted = await persistTransactions(enriched);

    const flagged = enriched.filter(t => t.flagged);
    if (flagged.length > 0 && process.env.NOTIFY_FUNCTION_NAME) {
      await invokeNextLambda(process.env.NOTIFY_FUNCTION_NAME, { transactions: flagged });
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        count: enriched.length,
        flaggedCount: flagged.length,
        persisted,
        transactions: enriched
      })
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to categorize transactions", detail: err.message })
    };
  }
};

// Exported for local testing without invoking through API Gateway
exports.analyzeWithClaude = analyzeWithClaude;
exports.mergeAnalysis = mergeAnalysis;
exports.RESULT_SCHEMA = RESULT_SCHEMA;
exports.SYSTEM_PROMPT = SYSTEM_PROMPT;
