/**
 * Bundled sample analysis — the sample_statement run through the pipeline,
 * with categories, flags, and plain-language explanations filled in as Claude
 * would. Lets the dashboard demo the full experience with no backend, and
 * doubles as the fallback whenever a live API call isn't available.
 *
 * The three planted anomalies (large overseas purchase, duplicate same-day
 * charge, vague high-value merchant) are flagged here.
 */

export const MOCK_TRANSACTIONS = [
  { transactionId: "m01", accountRef: "****4821", date: "2026-06-15", merchant: "COUNTDOWN AUCKLAND CBD", amount: 87.42, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "m02", accountRef: "****4821", date: "2026-06-15", merchant: "SPARK NZ MOBILE", amount: 49.99, direction: "debit", category: "utilities", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "m03", accountRef: "****4821", date: "2026-06-16", merchant: "UBER TRIP", amount: 18.50, direction: "debit", category: "transport", flagged: false, explanation: null, anomalyScore: 0.06 },
  { transactionId: "m04", accountRef: "****4821", date: "2026-06-17", merchant: "PAK N SAVE MT ALBERT", amount: 102.10, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "m05", accountRef: "****4821", date: "2026-06-18", merchant: "NETFLIX.COM", amount: 22.99, direction: "debit", category: "subscriptions", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "m06", accountRef: "****4821", date: "2026-06-19", merchant: "MCDONALDS QUEEN ST", amount: 14.20, direction: "debit", category: "dining", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "m07", accountRef: "****4821", date: "2026-06-20", merchant: "SALARY PAYMENT ACME LTD", amount: 2450.00, direction: "credit", category: "transfer", flagged: false, explanation: null, anomalyScore: 0.02 },
  { transactionId: "m08", accountRef: "****4821", date: "2026-06-21", merchant: "CONTACT ENERGY", amount: 145.30, direction: "debit", category: "utilities", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "m09", accountRef: "****4821", date: "2026-06-22", merchant: "BUNNINGS WAREHOUSE", amount: 63.75, direction: "debit", category: "shopping", flagged: false, explanation: null, anomalyScore: 0.07 },
  { transactionId: "m10", accountRef: "****4821", date: "2026-06-23", merchant: "SPOTIFY", amount: 14.99, direction: "debit", category: "subscriptions", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "m11", accountRef: "****4821", date: "2026-06-24", merchant: "ELECTRONICS WORLD HK", amount: 1850.00, direction: "debit", category: "shopping", flagged: true, explanation: "A large $1,850 purchase from an electronics retailer based in Hong Kong — far bigger than anything else on your statement and from overseas, so it's worth confirming you made it.", anomalyScore: 0.88 },
  { transactionId: "m12", accountRef: "****4821", date: "2026-06-25", merchant: "GLORIA JEANS COFFEE", amount: 6.50, direction: "debit", category: "dining", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "m13", accountRef: "****4821", date: "2026-06-26", merchant: "PAK N SAVE MT ALBERT", amount: 95.20, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "m14", accountRef: "****4821", date: "2026-06-27", merchant: "MCDONALDS QUEEN ST", amount: 14.20, direction: "debit", category: "dining", flagged: true, explanation: "This exact charge of $14.20 at McDonald's appears twice on the same day — that often means you were accidentally billed twice.", anomalyScore: 0.72 },
  { transactionId: "m15", accountRef: "****4821", date: "2026-06-27", merchant: "MCDONALDS QUEEN ST", amount: 14.20, direction: "debit", category: "dining", flagged: true, explanation: "This exact charge of $14.20 at McDonald's appears twice on the same day — that often means you were accidentally billed twice.", anomalyScore: 0.72 },
  { transactionId: "m16", accountRef: "****4821", date: "2026-06-28", merchant: "UNKNOWN MERCHANT OVERSEAS", amount: 499.00, direction: "debit", category: "uncategorized", flagged: true, explanation: "A $499 charge from a merchant we couldn't identify, based overseas. High-value payments to unclear merchants are a common sign of fraud and worth checking.", anomalyScore: 0.81 },
  { transactionId: "m17", accountRef: "****4821", date: "2026-06-29", merchant: "COUNTDOWN AUCKLAND CBD", amount: 91.30, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "m18", accountRef: "****4821", date: "2026-06-30", merchant: "RENT PAYMENT", amount: 650.00, direction: "debit", category: "transfer", flagged: false, explanation: null, anomalyScore: 0.03 }
];
