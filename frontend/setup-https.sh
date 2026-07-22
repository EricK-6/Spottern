#!/usr/bin/env bash
# Put CloudFront in front of the S3 site so it is reachable over HTTPS.
# S3 website endpoints are HTTP only, which LinkedIn and most platforms reject.
#
# Run once:  bash setup-https.sh
# Requires:  aws sso login --profile uni
set -euo pipefail

BUCKET="spottern-web-392362834766-ap-southeast-2"
REGION="ap-southeast-2"
PROFILE="uni"
ORIGIN="${BUCKET}.s3-website-${REGION}.amazonaws.com"
REF="spottern-$(date +%s)"

# Reuse the distribution if it already exists.
EXISTING=$(aws cloudfront list-distributions --profile "$PROFILE" \
  --query "DistributionList.Items[?Comment=='Spottern static site'].DomainName | [0]" \
  --output text 2>/dev/null || echo "None")

if [ "$EXISTING" != "None" ] && [ -n "$EXISTING" ]; then
  echo "✅ Already exists: https://$EXISTING"
  exit 0
fi

cat > /tmp/spottern-cf.json <<JSON
{
  "CallerReference": "$REF",
  "Comment": "Spottern static site",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "spottern-s3-website",
      "DomainName": "$ORIGIN",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only",
        "OriginSslProtocols": { "Quantity": 1, "Items": ["TLSv1.2"] }
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "spottern-s3-website",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2, "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "PriceClass": "PriceClass_All"
}
JSON

echo "==> Creating CloudFront distribution (HTTPS in front of S3)"
DOMAIN=$(aws cloudfront create-distribution --profile "$PROFILE" \
  --distribution-config file:///tmp/spottern-cf.json \
  --query "Distribution.DomainName" --output text)

echo ""
echo "✅ HTTPS URL: https://$DOMAIN"
echo "   CloudFront takes about 5 to 15 minutes to finish deploying."
echo "   Check status with:"
echo "     aws cloudfront list-distributions --profile $PROFILE \\"
echo "       --query \"DistributionList.Items[?Comment=='Spottern static site'].[DomainName,Status]\" --output table"
