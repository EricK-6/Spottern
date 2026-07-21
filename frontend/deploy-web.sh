#!/usr/bin/env bash
# Publish the Spottern frontend to S3 static website hosting (demo mode).
# Run from the frontend/ folder:  bash deploy-web.sh
# Requires: aws CLI logged in as the uni profile.
set -euo pipefail

BUCKET="spottern-web-392362834766-ap-southeast-2"
REGION="ap-southeast-2"
PROFILE="uni"

echo "==> Building frontend in demo mode"
# Build without VITE_API_BASE so the public site runs the bundled sample
# analysis (clean demo, no failed API calls). To publish a LIVE build once
# Bedrock access lands, run `npm run build` normally (it reads .env) and then
# just re-run the sync step at the bottom.
if [ -f .env ]; then mv .env .env.hidden.bak; fi
VITE_API_BASE="" npm run build
if [ -f .env.hidden.bak ]; then mv .env.hidden.bak .env; fi

echo "==> Making the bucket publicly readable"
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
  --profile "$PROFILE"

aws s3api put-bucket-policy --bucket "$BUCKET" --profile "$PROFILE" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicRead\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::$BUCKET/*\"
  }]
}"

echo "==> Enabling static website hosting"
aws s3 website "s3://$BUCKET/" --index-document index.html --error-document index.html --profile "$PROFILE"

echo "==> Uploading dist/"
aws s3 sync dist/ "s3://$BUCKET/" --delete --profile "$PROFILE"

echo ""
echo "✅ Live at: http://$BUCKET.s3-website-$REGION.amazonaws.com"
