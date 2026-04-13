# Cloud Infrastructure Architecture (Terraform)

This directory contains the Infrastructure as Code (IaC) definitions for the AI ATS Resume platform.

## 🏗️ Architectural Overview

The platform follows a **Multi-Tier Microservices Pattern**, decoupled for scalability and resilience.

### 1. Presentation Tier (Frontend)
- **Service:** Amazon S3 + CloudFront CDN.
- **Security:** Origin Access Control (OAC) ensures the S3 bucket is private and only accessible via the global CDN.

### 2. Logic Tier (Backend)
- **Service:** Amazon EC2 (Elastic Compute Cloud).
- **Orchestration:** Docker Compose manages the FastAPI, Nginx, and Frontend containers.
- **Security:** Least-Privilege IAM Roles provide secure access to DynamoDB and CloudWatch without hardcoded credentials.

### 3. Data Tier (Persistence)
- **Service:** Amazon DynamoDB (NoSQL).
- **Design:** Partitioned schemas for Resumes, Jobs, and Users.

### 4. Identity & Secrets
- **Auth:** Amazon Cognito User Pools handle secure SRP authentication.
- **Secrets:** AWS Secrets Manager stores sensitive API keys (Gemini), decoupled from the source code.

### 5. Observability Tier
- **Logging:** Centralized logs via Amazon CloudWatch.
- **Monitoring:** Operational Dashboards and Alarms for proactive system health management.

---

## 🛠️ Deployment Instructions

1.  **Initialize:** `terraform init`
2.  **Validate:** `terraform validate`
3.  **Plan:** `terraform plan -var-file="secrets.tfvars"`
4.  **Apply:** `terraform apply -var-file="secrets.tfvars"`

## 🛡️ Security Measures
- **DevSecOps:** Integrated `tfsec` static analysis in CI/CD.
- **Encryption:** All data at rest (S3, DynamoDB) is encrypted using AWS-managed keys.
- **Network Security:** Security Groups follow a strict "Deny-All" default policy, opening only ports 80, 443, and 8000.
