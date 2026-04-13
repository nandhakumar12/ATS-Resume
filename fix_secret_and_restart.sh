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
echo "=== Recreating/updating secret with current config ==="
aws secretsmanager create-secret \
  --name "$SECRET_NAME" \
  --region "$REGION" \
  --secret-string '{
    "GEMINI_API_KEY": "AIzaSyCvfG-gEsBjeam054I9B5Gk3h8xjWX8jng",
    "COGNITO_USER_POOL_ID": "us-east-1_5rSehoZbr",
    "COGNITO_APP_CLIENT_ID": "4td5k9rcuoph3fs5q67gjji93p",
    "COGNITO_REGION": "us-east-1",
    "COGNITO_DOMAIN": "https://us-east-15rsehozbr.auth.us-east-1.amazoncognito.com",
    "COGNITO_REDIRECT_URI": "https://nandhakumar.works/api/auth/callback",
    "COGNITO_LOGOUT_URI": "https://nandhakumar.works",
    "DDB_RESUMES_TABLE": "ats_resumes",
    "DDB_JOBS_TABLE": "ats_jobs",
    "DDB_USERS_TABLE": "ats_users"
  }' 2>/dev/null || \
aws secretsmanager put-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" \
  --secret-string '{
    "GEMINI_API_KEY": "AIzaSyCvfG-gEsBjeam054I9B5Gk3h8xjWX8jng",
    "COGNITO_USER_POOL_ID": "us-east-1_5rSehoZbr",
    "COGNITO_APP_CLIENT_ID": "4td5k9rcuoph3fs5q67gjji93p",
    "COGNITO_REGION": "us-east-1",
    "COGNITO_DOMAIN": "https://us-east-15rsehozbr.auth.us-east-1.amazoncognito.com",
    "COGNITO_REDIRECT_URI": "https://nandhakumar.works/api/auth/callback",
    "COGNITO_LOGOUT_URI": "https://nandhakumar.works",
    "DDB_RESUMES_TABLE": "ats_resumes",
    "DDB_JOBS_TABLE": "ats_jobs",
    "DDB_USERS_TABLE": "ats_users"
  }'

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
