# Deploying Spottern

The whole backend is one AWS SAM stack: S3 uploads bucket, five Lambdas, a
DynamoDB table, an SNS topic, and an HTTP API. Region is pinned to
**ap-southeast-2 (Sydney)** — the only region Bedrock is reachable on the uni
account.

## Prerequisites

1. **AWS CLI + SAM CLI** installed, and an authenticated session:
   ```bash
   aws sso login --profile uni
   export AWS_PROFILE=uni      # so sam/aws use the uni account
   ```
2. **Bedrock model access** for Anthropic Claude on the account. This is the one
   thing you can't self-serve — an org admin must enable it (our permission set
   is blocked from `aws-marketplace:Subscribe`). Until it's granted, everything
   deploys and runs *except* the live categorize call. Verify with:
   ```bash
   aws bedrock get-foundation-model-availability \
     --model-id anthropic.claude-opus-4-8 --region ap-southeast-2 \
     --query agreementAvailability.status --output text
   # want: AVAILABLE  (NOT_AVAILABLE = still blocked)
   ```
3. **Node deps for the categorize Lambda** (bundled into its zip):
   ```bash
   cd backend/lambdas/categorize && npm install && cd -
   ```

## Deploy

```bash
cd backend
sam deploy --guided        # first time — accept the samconfig defaults
# subsequent deploys: just `sam deploy`
```

Note the stack **Outputs** — you'll need `ApiBaseUrl` for the frontend and
`UploadsBucketName` for PDF testing. Re-print them anytime:

```bash
aws cloudformation describe-stacks --stack-name spottern \
  --query "Stacks[0].Outputs" --output table
```

## Wire up the frontend

```bash
cd frontend
echo "VITE_API_BASE=<ApiBaseUrl from outputs>" > .env
npm install && npm run build     # dist/ is deployable to any static host
# or: npm run dev  (local dev against the live API)
```

Without `.env`, the frontend runs in demo mode against bundled sample data — so
it always works for a demo even before the backend is up.

## Notifications (manual, one-time)

**Customer email (SES).** SES starts in sandbox mode — you must verify both the
sender and any recipient:

```bash
aws ses verify-email-identity --email-address you@example.com
# click the link AWS emails you, then redeploy with the address wired in:
sam deploy --parameter-overrides SenderEmail=you@example.com CustomerEmail=you@example.com
```

**BNZ alert (SNS).** Subscribe a demo endpoint to the fraud-ops topic:

```bash
aws sns subscribe --topic-arn <FraudTopicArn from outputs> \
  --protocol email --notification-endpoint bnz-demo@example.com
# confirm via the email AWS sends
```

Both channels self-skip if unconfigured, so the pipeline still runs without them.

## Try it end to end

**CSV (synchronous):**
```bash
curl -X POST "<ApiBaseUrl>/ingest/csv" --data-binary @../sample-data/sample_statement.csv \
  -H "Content-Type: text/plain" > /tmp/txns.json
curl -X POST "<ApiBaseUrl>/categorize" -H "Content-Type: application/json" \
  --data @/tmp/txns.json
```

**PDF (async, S3-triggered):**
```bash
aws s3 cp ../sample-data/sample_statement.pdf s3://<UploadsBucketName>/
# Textract -> categorize -> DynamoDB runs automatically; then:
curl "<ApiBaseUrl>/transactions"
```

Expected: the three planted anomalies (ELECTRONICS WORLD HK, the duplicate
MCDONALDS pair, UNKNOWN MERCHANT OVERSEAS) come back `flagged: true` with
plain-language explanations.

## Tear down

```bash
sam delete --stack-name spottern      # empties/removes everything in the stack
```
