/**
 * Spottern! shared transaction schema.
 * Every Lambda in the pipeline (ingest, categorize, notify) should read
 * and write objects matching this shape, so nothing downstream ever
 * has to guess at field names.
 */

/**
 * @typedef {Object} Transaction
 * @property {string} transactionId      - UUID, generated at ingestion time
 * @property {string} accountRef         - Masked account reference, e.g. "****1234"
 * @property {string} date               - ISO 8601, e.g. "2026-07-10"
 * @property {string} merchant           - Raw merchant/description string from statement
 * @property {number} amount             - Positive number, use `direction` for in/out
 * @property {"debit"|"credit"} direction
 * @property {string} sourceFormat       - "pdf" or "csv"
 * @property {string|null} category      - Filled in by the categorize Lambda
 * @property {boolean} flagged           - Set true if Bedrock/anomaly logic flags it
 * @property {string|null} explanation   - Plain language reasoning from Bedrock
 * @property {number|null} anomalyScore  - Simulated Fraud Detector style score, 0 to 1
 * @property {string} createdAt          - ISO 8601 timestamp, when this record was created
 */

const CATEGORIES = [
  "groceries",
  "dining",
  "transport",
  "subscriptions",
  "utilities",
  "entertainment",
  "shopping",
  "health",
  "travel",
  "transfer",
  "uncategorized"
];

// Example of a fully populated record, useful as a reference when wiring up
// DynamoDB puts/gets or mocking frontend data before the backend is ready.
const EXAMPLE_TRANSACTION = {
  transactionId: "b3f1c2e0-1234-4a5b-9c8d-abcdef123456",
  accountRef: "****4821",
  date: "2026-07-10",
  merchant: "COUNTDOWN AUCKLAND CBD",
  amount: 87.42,
  direction: "debit",
  sourceFormat: "csv",
  category: "groceries",
  flagged: false,
  explanation: null,
  anomalyScore: 0.04,
  createdAt: "2026-07-10T09:15:00Z"
};

module.exports = { CATEGORIES, EXAMPLE_TRANSACTION };
