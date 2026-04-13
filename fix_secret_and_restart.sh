#!/bin/bash
# Run this on the EC2 instance to fix the "Failed to create job" 500 error
# This recreates the Secrets Manager secret and restarts containers
set -e

REGION="us-east-1"
SECRET_NAME="ats/backend/secrets-25126067"

echo "=== Checking if secret exists ==="
aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" 2>/dev/null \
  && echo "Secret EXISTS" \
  || echo "Secret MISSING - will create it"

echo ""
# Load .env variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file missing!"
  exit 1
fi

PAYLOAD=$(cat <<EOF
{
  "GEMINI_API_KEY": "${GEMINI_API_KEY}",
  "COGNITO_USER_POOL_ID": "${COGNITO_USER_POOL_ID}",
  "COGNITO_APP_CLIENT_ID": "${COGNITO_APP_CLIENT_ID}",
  "COGNITO_REGION": "${COGNITO_REGION}",
  "COGNITO_DOMAIN": "${COGNITO_DOMAIN}",
  "COGNITO_REDIRECT_URI": "${COGNITO_REDIRECT_URI}",
  "COGNITO_LOGOUT_URI": "${COGNITO_LOGOUT_URI}",
  "DDB_RESUMES_TABLE": "ats_resumes",
  "DDB_JOBS_TABLE": "ats_jobs",
  "DDB_USERS_TABLE": "ats_users"
}
EOF
)

echo "=== Recreating/updating secret with current config ==="
aws secretsmanager create-secret \
  --name "$SECRET_NAME" \
  --region "$REGION" \
  --secret-string "$PAYLOAD" 2>/dev/null || \
aws secretsmanager put-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" \
  --secret-string "$PAYLOAD"

echo "Secret created/updated successfully"

echo ""
echo "=== Restarting backend container to pick up secret ==="
cd /home/ubuntu/ATS-Resume
docker compose restart backend

echo ""
echo "=== Waiting 8 seconds ==="
sleep 8

echo ""
echo "=== Checking backend logs for secret injection ==="
docker logs ats-backend --tail 20 | grep -i "secret\|inject\|error" || true

echo ""
echo "=== Testing health endpoint ==="
curl -s http://localhost/api/health | python3 -m json.tool

echo ""
echo "=== DONE - try creating a job now ==="
