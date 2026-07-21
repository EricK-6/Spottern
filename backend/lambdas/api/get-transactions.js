/**
 * Read API: GET /transactions
 * Returns the enriched transactions stored in DynamoDB by the categorize
 * Lambda. Used to display results from the async PDF pipeline (S3 -> Textract
 * -> categorize -> DynamoDB), where the browser can't await the result inline.
 *
 * Env vars:
 *   TABLE_NAME   - DynamoDB table (required)
 *
 * No npm install needed — DynamoDB clients ship with the Lambda runtime.
 * IAM needs dynamodb:Scan on the table.
 */

const { CORS_HEADERS } = require("../../shared/pipeline");

/** Sort newest-first and drop nothing — the shape is already the schema. */
function orderTransactions(items) {
  return [...items].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

async function scanTable(tableName) {
  const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
  const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  const items = [];
  let lastKey;
  do {
    const res = await doc.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey: lastKey }));
    items.push(...(res.Items || []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

exports.handler = async () => {
  try {
    const tableName = process.env.TABLE_NAME;
    if (!tableName) throw new Error("TABLE_NAME is not configured");

    const transactions = orderTransactions(await scanTable(tableName));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ count: transactions.length, transactions })
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to read transactions", detail: err.message })
    };
  }
};

exports.orderTransactions = orderTransactions;
