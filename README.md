# AI-Powered ATS Resume Platform

This is a cloud-native application designed to help recruiters parse resumes and score them using AI. It uses a combination of NLTK for keyword matching and Google Gemini for semantic scoring.

## Tech Stack
*   **Frontend**: React (Vite)
*   **Backend**: FastAPI (Python)
*   **Proxy**: Nginx
*   **Database**: AWS DynamoDB
*   **Auth**: AWS Cognito
*   **Infrastructure**: Terraform

## Project Structure
*   `backend/` - The Python API
*   `frontend/` - The React app
*   `terraform/` - AWS infrastructure files
*   `figures/` - Diagrams for the report

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root with your keys:
*   `GOOGLE_API_KEY`
*   `AWS_REGION`
*   `USER_POOL_ID`

### 2. AWS Setup
If you want to create the resources on AWS, use Terraform:
```bash
cd terraform
terraform init
terraform apply
```

### 3. Run with Docker
The easiest way to run the app is using Docker Compose:
```bash
docker-compose up --build
```
The app will be available on your localhost.

## Security & Cleanup
The project includes a custom PII sanitizer library I built called `CloudResumeSanitizer`. You can find it on PyPI. It removes names and emails before sending data to the AI.

We also use:
*   **Bandit** for code security scans
*   **OWASP ZAP** for website security testing
*   **SonarCloud** for overall code quality

Deployed at: https://www.nandhakumar.works
