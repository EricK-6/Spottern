/**
 * Ingest Lambda, CSV path.
 * Expects a raw CSV string (from S3 or direct upload body) matching:
 *   date,merchant,amount,direction,accountRef
 * Normalizes into the shared Transaction schema and returns an array
 * ready to hand off to the categorize Lambda / DynamoDB put.
 */

const { randomUUID } = require("crypto");

function parseCsvStatement(csvText, sourceFormat = "csv") {
  const lines = csvText.trim().split("\n");
  const header = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1);

  return rows
    .filter(line => line.trim().length > 0)
    .map(line => {
      const values = line.split(",").map(v => v.trim());
      const record = Object.fromEntries(header.map((h, i) => [h, values[i]]));

      return {
        transactionId: randomUUID(),
        accountRef: record.accountRef,
        date: record.date,
        merchant: record.merchant,
        amount: parseFloat(record.amount),
        direction: record.direction,
        sourceFormat,
        category: null,
        flagged: false,
        explanation: null,
        anomalyScore: null,
        createdAt: new Date().toISOString()
      };
    });
}

exports.handler = async (event) => {
  try {
    // event.body expected to be the raw CSV text (adjust if S3-triggered instead)
    const csvText = event.body;
    const transactions = parseCsvStatement(csvText);

    return {
      statusCode: 200,
      body: JSON.stringify({ count: transactions.length, transactions })
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Failed to parse CSV statement", detail: err.message })
    };
  }
};

// Exported for local testing without invoking through API Gateway
exports.parseCsvStatement = parseCsvStatement;
