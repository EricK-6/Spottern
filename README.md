# Spottern!

AWS x BNZ AI Hackathon 2026, Challenge 2 (AI Innovation).

**Live demo:** http://spottern-web-392362834766-ap-southeast-2.s3-website-ap-southeast-2.amazonaws.com

Pick one of the three sample statements on the landing page to see the full
review: categorised spending, flagged transactions with plain-language
explanations, and a risk level for each.

Upload a bank statement (PDF or CSV); Spottern extracts the transactions,
categorizes your spending, flags anything unusual or suspicious with a
plain-language explanation from **Claude Opus 4.8 on Amazon Bedrock**, and
notifies both you and BNZ.

## Architecture

```
        CSV  ─── API Gateway ──▶ ingest (csv)  ─┐
                                                 ├─▶ categorize ──▶ DynamoDB
   PDF ─▶ S3 ─▶ ingest (pdf, Textract) ─────────┘   (Bedrock:        │
                                                     Opus 4.8,        ▼
                                                     flag + explain) notify
                                                                    ├─ SES  → customer
                                                                    └─ SNS  → BNZ fraud-ops
   React frontend ◀── API Gateway (categorize result / GET transactions)
```

- **S3**: raw statement storage; a `.pdf` upload triggers the async pipeline.
- **Lambda**: ingest (CSV + Textract PDF), categorize, notify, read API.
- **Amazon Textract**: table extraction from PDF statements.
- **Amazon Bedrock (Claude Opus 4.8)**: categorization + anomaly reasoning,
  whole-statement context so it catches duplicates and out-of-pattern spend.
- **DynamoDB**: enriched transaction records.
- **SNS / SES**: bank + customer notifications.
- **React (Vite)**: upload UI and dashboard (flagged alerts, category chart).

Every stage reads/writes the locked schema in
[`backend/shared/transaction-schema.js`](backend/shared/transaction-schema.js).

## Layout

```
backend/
  shared/            transaction-schema.js, pipeline.js (Lambda chaining + CORS)
  lambdas/
    ingest/          csv-parser.js, pdf-parser.js (Textract)
    categorize/      index.js (Bedrock Opus 4.8) + bundled deps
    notify/          index.js (SES email + SNS alert)
    api/             get-transactions.js
  template.yaml      AWS SAM stack (everything above)
  DEPLOY.md          step-by-step deploy guide
frontend/            React + Vite dashboard (demo-mode fallback built in)
sample-data/         sample_statement.csv / .pdf with 3 planted anomalies
```

## Quick start

**Frontend demo (no AWS needed):**
```bash
cd frontend && npm install && npm run dev
```
Runs against bundled sample data, full dashboard, all three anomalies flagged.

**Full backend:** see [`backend/DEPLOY.md`](backend/DEPLOY.md).

## Local tests

The Lambdas export their pure functions for `node`-only testing (no AWS):
CSV/PDF parsing, the categorize merge logic, and the notify message builders
are all covered.
