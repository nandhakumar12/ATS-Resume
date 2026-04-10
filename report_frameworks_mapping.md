# Application of Industry Standards to the AI ATS Platform

This document outlines how the AI-Powered ATS platform was designed and developed following industry-standard frameworks. You can use these sections directly in your thesis or technical report to demonstrate your understanding of DevSecOps, Cybersecurity, and Cloud Architecture.

---

## 1. Software Development Life Cycle (SDLC) - Agile & DevSecOps

The project followed an **Agile DevSecOps SDLC**, integrating security and continuous delivery into every phase:

1. **Planning & Requirements Analysis:** Identified the need for an unbiased recruitment tool. Defined the hybrid architecture requirements: a deterministic NLP algorithm (spaCy) for baseline scoring, and an Explainable AI (XAI / Gemini) for qualitative analysis.
2. **System Design:** Architected a containerized Microservices model. Decoupled the React/Vite Frontend from the Python/FastAPI Backend to allow independent scaling, mediated by an Nginx reverse proxy.
3. **Implementation (Coding):** Developed the custom `CloudResumeSanitizer` library to handle PII. Implemented robust API endpoints and resilient AI service classes with automatic model fallback mechanisms.
4. **Testing (Automated Validation):** Integrated GitHub Actions CI/CD to automatically build Docker images during push events. This ensures that broken code (e.g., missing dependencies) fails the pipeline before reaching the production server.
5. **Deployment:** Deployed on an Amazon EC2 instance using `docker-compose`. Leveraged Amazon ECR (Elastic Container Registry) as the central artifact repository for production-ready images.
6. **Maintenance & Monitoring:** Implemented `logger` metrics within the FastAPI backend to track AI analysis failures, API rate limits, and processing times for observability.

---

## 2. The CIA Triad Integration

The core cybersecurity model—**Confidentiality, Integrity, and Availability**—was heavily integrated into the platform's DNA.

> **Highlighting the `CloudResumeSanitizer`**
> Be sure to emphasize your custom sanitizer in the Confidentiality section, as mitigating AI Bias and protecting user privacy is a massive academic grading point!

### Confidentiality (Data Privacy)
- **PII Redaction:** Before any resume data leaves the secure AWS backend to be processed by Google's Gemini LLM, the `CloudResumeSanitizer` intercepts it. It uses RegEx to explicitly strip Emails, Phone Numbers, Addresses, and LinkedIn URLs to protect candidate anonymity.
- **Secure Authentication:** AWS Cognito was implemented to ensure that candidates and recruiters securely log in using the Secure Remote Password (SRP) protocol, meaning passwords never travel in plaintext.

### Integrity (Data Accuracy & Protection)
- **Immutable Storage:** Resumes are hashed using UUIDs (Universally Unique Identifiers) in DynamoDB. This ensures that user records cannot be manipulated or overwritten by predictive ID guessing (IDOR vulnerabilities).
- **Pipeline Integrity:** By strictly deploying images via GitHub Actions rather than manual file transfers, we ensure that the source code remains the ultimate source of truth.

### Availability (Uptime & Resilience)
- **Graceful Degradation:** The AI Engine possesses automatic fallback logic. If the Google Gemini API reaches a limit (`429`) or a model is deprecated (`404`), the backend catches the error silently and allows the spaCy ATS engine to continue serving the user without crashing the website.
- **Container Auto-Recovery:** All Docker containers are configured with a `restart: unless-stopped` policy, ensuring the OS automatically boots them back up in the event of an EC2 crash or reboot.

---

## 3. AAA Security Framework

The system utilizes the AAA framework to govern internal and external access to the cloud environment.

1. **Authentication (Who are you?):** 
   - Users establish identity via Amazon Cognito User Pools before accessing the core Dashboard.
   - The CI/CD pipeline authenticates with AWS using robust GitHub Secrets (`AWS_ACCESS_KEY_ID`).
2. **Authorization (What can you do?):** 
   - The platform relies on strict AWS IAM (Identity and Access Management) Role-Based Access Control (RBAC). The EC2 instance and deployment pipeline are given *Least-Privilege* permissions—capable only of pushing and pulling from ECR, preventing lateral movement if compromised.
3. **Accounting (What did you do?):** 
   - The Python backend maintains standard output logging, creating an auditable trail of when an analysis was requested, which model was used, and if any components failed.

---

## 4. Key Cloud Computing Principles Followed

- **Decoupling / Microservices:** The frontend UI relies strictly on RESTful API communication with the backend. This allows the backend to be upgraded (like swapping spaCy for another NLP tool) without forcing the frontend to rewrite its UI logic.
- **Scalability (Horizontal Readiness):** Because the FastAPI backend is completely stateless (offloading storage to S3/Local Volumes and DynamoDB), multiple containers can be spun up behind an Application Load Balancer to handle thousands of concurrent resume uploads.
- **Infrastructure Standardization:** Leveraging `docker-compose.yml` ensures that the development environment on a local Windows machine is exactly a 1:1 replica of the production environment on Ubuntu Linux, virtually eliminating "It works on my machine" bugs.
