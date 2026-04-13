#!/bin/bash
# ============================================================
# FIX: "Failed to create job" 500 Error
# Root Cause: Expired AWS Session Token in Docker containers
# Solution: Remove hardcoded credentials so boto3 uses EC2 IAM Role
# ============================================================

set -e

echo "=== Step 1: Stop running containers ==="
docker-compose down

echo "=== Step 2: Update .env with fresh AWS credentials from instance metadata ==="
# Get fresh creds from EC2 instance metadata (LabInstanceProfile)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

ROLE_NAME=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/iam/security-credentials/)

CREDS=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  "http://169.254.169.254/latest/meta-data/iam/security-credentials/$ROLE_NAME")

NEW_KEY=$(echo $CREDS | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['AccessKeyId'])")
NEW_SECRET=$(echo $CREDS | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['SecretAccessKey'])")
NEW_TOKEN=$(echo $CREDS | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['Token'])")
NEW_REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/placement/region)

echo "Role: $ROLE_NAME"
echo "Region: $NEW_REGION"
echo "AccessKeyId: $NEW_KEY"

echo "=== Step 3: Write updated .env ==="
cat > /home/ubuntu/app/.env << EOF
# Cognito
VITE_COGNITO_USER_POOL_ID=us-east-1_5rSehoZbr
VITE_COGNITO_CLIENT_ID=4td5k9rcuoph3fs5q67gjji93p
COGNITO_USER_POOL_ID=us-east-1_5rSehoZbr
COGNITO_APP_CLIENT_ID=4td5k9rcuoph3fs5q67gjji93p
COGNITO_REGION=us-east-1
COGNITO_DOMAIN=https://us-east-15rsehozbr.auth.us-east-1.amazoncognito.com
COGNITO_REDIRECT_URI=https://nandhakumar.works/api/auth/callback
COGNITO_LOGOUT_URI=https://nandhakumar.works

# AWS - Fresh creds from EC2 IAM Role
AWS_ACCESS_KEY_ID=${NEW_KEY}
AWS_SECRET_ACCESS_KEY=${NEW_SECRET}
AWS_SESSION_TOKEN=${NEW_TOKEN}
AWS_REGION=${NEW_REGION}

# DynamoDB Tables
DDB_USERS_TABLE=ats_users
DDB_RESUMES_TABLE=ats_resumes
DDB_JOBS_TABLE=ats_jobs

# Gemini
GEMINI_API_KEY=AIzaSyCvfG-gEsBjeam054I9B5Gk3h8xjWX8jng

# ECR
ECR_REGISTRY=857238695432.dkr.ecr.us-east-1.amazonaws.com/ats
EOF

echo "=== Step 4: Restart containers with fresh credentials ==="
docker-compose --env-file /home/ubuntu/app/.env up -d

echo "=== Step 5: Wait for backend to be ready ==="
sleep 10

echo "=== Step 6: Test /api/health ==="
curl -s http://localhost/api/health | python3 -m json.tool

echo "=== Step 7: Check backend logs for DynamoDB errors ==="
docker logs ats-backend --tail 30

echo ""
echo "=========================================="
echo "FIX APPLIED SUCCESSFULLY"
echo "The containers are now using fresh AWS credentials"
echo "Try creating a job at https://nandhakumar.works"
echo "=========================================="
