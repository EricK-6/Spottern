/**
 * Bundled sample analyses — three statements run through the pipeline, with
 * categories, flags, and plain-language explanations filled in as Claude
 * would. Lets the dashboard demo the full experience with no backend, and
 * doubles as the fallback whenever a live API call isn't available.
 *
 * Each sample plants a different fraud pattern so the demo can show range.
 */

const EVERYDAY = [
  { transactionId: "e01", accountRef: "****4821", date: "2026-06-15", merchant: "COUNTDOWN AUCKLAND CBD", amount: 87.42, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "e02", accountRef: "****4821", date: "2026-06-15", merchant: "SPARK NZ MOBILE", amount: 49.99, direction: "debit", category: "utilities", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "e03", accountRef: "****4821", date: "2026-06-16", merchant: "UBER TRIP", amount: 18.50, direction: "debit", category: "transport", flagged: false, explanation: null, anomalyScore: 0.06 },
  { transactionId: "e04", accountRef: "****4821", date: "2026-06-17", merchant: "PAK N SAVE MT ALBERT", amount: 102.10, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "e05", accountRef: "****4821", date: "2026-06-18", merchant: "NETFLIX.COM", amount: 22.99, direction: "debit", category: "subscriptions", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "e06", accountRef: "****4821", date: "2026-06-19", merchant: "MCDONALDS QUEEN ST", amount: 14.20, direction: "debit", category: "dining", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "e07", accountRef: "****4821", date: "2026-06-20", merchant: "SALARY PAYMENT ACME LTD", amount: 2450.00, direction: "credit", category: "transfer", flagged: false, explanation: null, anomalyScore: 0.02 },
  { transactionId: "e08", accountRef: "****4821", date: "2026-06-21", merchant: "CONTACT ENERGY", amount: 145.30, direction: "debit", category: "utilities", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "e09", accountRef: "****4821", date: "2026-06-22", merchant: "BUNNINGS WAREHOUSE", amount: 63.75, direction: "debit", category: "shopping", flagged: false, explanation: null, anomalyScore: 0.07 },
  { transactionId: "e10", accountRef: "****4821", date: "2026-06-23", merchant: "SPOTIFY", amount: 14.99, direction: "debit", category: "subscriptions", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "e11", accountRef: "****4821", date: "2026-06-24", merchant: "ELECTRONICS WORLD HK", amount: 1850.00, direction: "debit", category: "shopping", flagged: true, explanation: "A large $1,850 purchase from an electronics retailer based in Hong Kong — far bigger than anything else on your statement and from overseas, so it's worth confirming you made it.", anomalyScore: 0.88 },
  { transactionId: "e12", accountRef: "****4821", date: "2026-06-25", merchant: "GLORIA JEANS COFFEE", amount: 6.50, direction: "debit", category: "dining", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "e13", accountRef: "****4821", date: "2026-06-26", merchant: "PAK N SAVE MT ALBERT", amount: 95.20, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "e14", accountRef: "****4821", date: "2026-06-27", merchant: "MCDONALDS QUEEN ST", amount: 14.20, direction: "debit", category: "dining", flagged: true, explanation: "This exact charge of $14.20 at McDonald's appears twice on the same day — that often means you were accidentally billed twice.", anomalyScore: 0.72 },
  { transactionId: "e15", accountRef: "****4821", date: "2026-06-27", merchant: "MCDONALDS QUEEN ST", amount: 14.20, direction: "debit", category: "dining", flagged: true, explanation: "This exact charge of $14.20 at McDonald's appears twice on the same day — that often means you were accidentally billed twice.", anomalyScore: 0.72 },
  { transactionId: "e16", accountRef: "****4821", date: "2026-06-28", merchant: "UNKNOWN MERCHANT OVERSEAS", amount: 499.00, direction: "debit", category: "uncategorized", flagged: true, explanation: "A $499 charge from a merchant we couldn't identify, based overseas. High-value payments to unclear merchants are a common sign of fraud and worth checking.", anomalyScore: 0.81 },
  { transactionId: "e17", accountRef: "****4821", date: "2026-06-29", merchant: "COUNTDOWN AUCKLAND CBD", amount: 91.30, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "e18", accountRef: "****4821", date: "2026-06-30", merchant: "RENT PAYMENT", amount: 650.00, direction: "debit", category: "transfer", flagged: false, explanation: null, anomalyScore: 0.03 }
];

const CARD_TESTING = [
  { transactionId: "c01", accountRef: "****2093", date: "2026-05-01", merchant: "SALARY WELLINGTON CITY COUNCIL", amount: 3200.00, direction: "credit", category: "transfer", flagged: false, explanation: null, anomalyScore: 0.02 },
  { transactionId: "c02", accountRef: "****2093", date: "2026-05-02", merchant: "NEW WORLD THORNDON", amount: 76.40, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "c03", accountRef: "****2093", date: "2026-05-03", merchant: "Z ENERGY TARANAKI ST", amount: 72.10, direction: "debit", category: "transport", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "c04", accountRef: "****2093", date: "2026-05-04", merchant: "ONE NZ MOBILE", amount: 55.00, direction: "debit", category: "utilities", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "c05", accountRef: "****2093", date: "2026-05-05", merchant: "NETFLIX.COM", amount: 24.99, direction: "debit", category: "subscriptions", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "c06", accountRef: "****2093", date: "2026-05-06", merchant: "MOJO COFFEE", amount: 5.80, direction: "debit", category: "dining", flagged: false, explanation: null, anomalyScore: 0.03 },
  { transactionId: "c07", accountRef: "****2093", date: "2026-05-07", merchant: "AT HOP TOPUP", amount: 40.00, direction: "debit", category: "transport", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "c08", accountRef: "****2093", date: "2026-05-08", merchant: "COUNTDOWN WELLINGTON", amount: 58.30, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "c09", accountRef: "****2093", date: "2026-05-10", merchant: "MERCURY ENERGY", amount: 132.45, direction: "debit", category: "utilities", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "c10", accountRef: "****2093", date: "2026-05-12", merchant: "SPOTIFY", amount: 14.99, direction: "debit", category: "subscriptions", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "c11", accountRef: "****2093", date: "2026-05-14", merchant: "PAYPAL *VERIFY", amount: 0.99, direction: "debit", category: "uncategorized", flagged: true, explanation: "One of three tiny charges from unfamiliar online services within minutes of each other — a common way fraudsters test whether a stolen card works before making a big purchase.", anomalyScore: 0.74 },
  { transactionId: "c12", accountRef: "****2093", date: "2026-05-14", merchant: "GOOGLE *TEMPHOLD", amount: 1.00, direction: "debit", category: "uncategorized", flagged: true, explanation: "A second tiny test-style charge on the same day from an unfamiliar service — part of a pattern that often precedes card fraud.", anomalyScore: 0.75 },
  { transactionId: "c13", accountRef: "****2093", date: "2026-05-14", merchant: "FASTSPRING *DIGITAL", amount: 2.00, direction: "debit", category: "uncategorized", flagged: true, explanation: "A third small charge in the same short window from an unknown merchant — three tiny charges like this together are a classic card-testing signal.", anomalyScore: 0.76 },
  { transactionId: "c14", accountRef: "****2093", date: "2026-05-15", merchant: "GADGET WORLD SINGAPORE", amount: 1420.00, direction: "debit", category: "shopping", flagged: true, explanation: "A large $1,420 purchase from an overseas electronics store the day after several tiny test charges — together these look like card fraud cashing out. Confirm you made this.", anomalyScore: 0.90 },
  { transactionId: "c15", accountRef: "****2093", date: "2026-05-16", merchant: "NEW WORLD THORNDON", amount: 64.20, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "c16", accountRef: "****2093", date: "2026-05-18", merchant: "UBER EATS", amount: 32.50, direction: "debit", category: "dining", flagged: true, explanation: "This $32.50 Uber Eats charge appears twice on the same day — often a sign you were accidentally billed twice.", anomalyScore: 0.70 },
  { transactionId: "c17", accountRef: "****2093", date: "2026-05-18", merchant: "UBER EATS", amount: 32.50, direction: "debit", category: "dining", flagged: true, explanation: "This $32.50 Uber Eats charge appears twice on the same day — often a sign you were accidentally billed twice.", anomalyScore: 0.70 },
  { transactionId: "c18", accountRef: "****2093", date: "2026-05-20", merchant: "KMART WELLINGTON", amount: 45.60, direction: "debit", category: "shopping", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "c19", accountRef: "****2093", date: "2026-05-22", merchant: "RENT PAYMENT", amount: 540.00, direction: "debit", category: "transfer", flagged: false, explanation: null, anomalyScore: 0.03 },
  { transactionId: "c20", accountRef: "****2093", date: "2026-05-25", merchant: "Z ENERGY TARANAKI ST", amount: 68.90, direction: "debit", category: "transport", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "c21", accountRef: "****2093", date: "2026-05-28", merchant: "COUNTDOWN WELLINGTON", amount: 71.15, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 }
];

const CRYPTO_SCAM = [
  { transactionId: "s01", accountRef: "****7756", date: "2026-04-01", merchant: "SALARY FONTERRA LTD", amount: 4100.00, direction: "credit", category: "transfer", flagged: false, explanation: null, anomalyScore: 0.02 },
  { transactionId: "s02", accountRef: "****7756", date: "2026-04-02", merchant: "PAK N SAVE HAMILTON", amount: 142.80, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "s03", accountRef: "****7756", date: "2026-04-03", merchant: "MITRE 10 MEGA", amount: 89.50, direction: "debit", category: "shopping", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "s04", accountRef: "****7756", date: "2026-04-04", merchant: "MERCURY ENERGY", amount: 168.20, direction: "debit", category: "utilities", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "s05", accountRef: "****7756", date: "2026-04-05", merchant: "SPARK BROADBAND", amount: 89.99, direction: "debit", category: "utilities", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "s06", accountRef: "****7756", date: "2026-04-06", merchant: "THE WAREHOUSE", amount: 53.40, direction: "debit", category: "shopping", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "s07", accountRef: "****7756", date: "2026-04-08", merchant: "COUNTDOWN HAMILTON", amount: 96.75, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "s08", accountRef: "****7756", date: "2026-04-09", merchant: "Z ENERGY HAMILTON", amount: 80.00, direction: "debit", category: "transport", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "s09", accountRef: "****7756", date: "2026-04-10", merchant: "BINANCE", amount: 500.00, direction: "debit", category: "transfer", flagged: true, explanation: "First of three payments to a cryptocurrency exchange over three days, each larger than the last — an escalating pattern often seen when an account has been taken over.", anomalyScore: 0.78 },
  { transactionId: "s10", accountRef: "****7756", date: "2026-04-11", merchant: "BINANCE", amount: 750.00, direction: "debit", category: "transfer", flagged: true, explanation: "A second, larger payment to the same crypto exchange a day later. The rapid increase day-on-day is a warning sign worth checking.", anomalyScore: 0.82 },
  { transactionId: "s11", accountRef: "****7756", date: "2026-04-12", merchant: "BINANCE", amount: 900.00, direction: "debit", category: "transfer", flagged: true, explanation: "The third and largest crypto payment in three days. Escalating transfers like this are a common sign of a scam or a compromised account.", anomalyScore: 0.85 },
  { transactionId: "s12", accountRef: "****7756", date: "2026-04-14", merchant: "NOEL LEEMING", amount: 220.00, direction: "debit", category: "shopping", flagged: false, explanation: null, anomalyScore: 0.06 },
  { transactionId: "s13", accountRef: "****7756", date: "2026-04-15", merchant: "MORTGAGE PAYMENT", amount: 1650.00, direction: "debit", category: "transfer", flagged: false, explanation: null, anomalyScore: 0.03 },
  { transactionId: "s14", accountRef: "****7756", date: "2026-04-17", merchant: "PAK N SAVE HAMILTON", amount: 131.20, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "s15", accountRef: "****7756", date: "2026-04-19", merchant: "INTERNATIONAL TRANSFER TO J WU", amount: 3500.00, direction: "debit", category: "transfer", flagged: true, explanation: "A $3,500 transfer overseas to a person you don't usually pay. Large one-off transfers to unfamiliar people are a common scam tactic — worth confirming before it clears.", anomalyScore: 0.88 },
  { transactionId: "s16", accountRef: "****7756", date: "2026-04-21", merchant: "COUNTDOWN HAMILTON", amount: 88.40, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 },
  { transactionId: "s17", accountRef: "****7756", date: "2026-04-23", merchant: "TAB ONLINE BETTING", amount: 300.00, direction: "debit", category: "entertainment", flagged: false, explanation: null, anomalyScore: 0.15 },
  { transactionId: "s18", accountRef: "****7756", date: "2026-04-25", merchant: "MERCURY ENERGY REFUND", amount: 44.10, direction: "credit", category: "utilities", flagged: false, explanation: null, anomalyScore: 0.02 },
  { transactionId: "s19", accountRef: "****7756", date: "2026-04-27", merchant: "BUNNINGS HAMILTON", amount: 67.30, direction: "debit", category: "shopping", flagged: false, explanation: null, anomalyScore: 0.05 },
  { transactionId: "s20", accountRef: "****7756", date: "2026-04-29", merchant: "PAK N SAVE HAMILTON", amount: 119.60, direction: "debit", category: "groceries", flagged: false, explanation: null, anomalyScore: 0.04 }
];

export const SAMPLES = [
  { id: "everyday", label: "Everyday spending", blurb: "Overseas buy · duplicate · vague merchant", transactions: EVERYDAY },
  { id: "card-testing", label: "Card-testing fraud", blurb: "Tiny test charges → big overseas cash-out", transactions: CARD_TESTING },
  { id: "crypto-scam", label: "Crypto & transfer scam", blurb: "Escalating crypto · large overseas transfer", transactions: CRYPTO_SCAM }
];

// Back-compat: the default sample used as the demo/fallback dataset.
export const MOCK_TRANSACTIONS = EVERYDAY;
