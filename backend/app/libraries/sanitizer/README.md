# CloudResumeSanitizer
# ====================
# A professional OOP library for PII (Personally Identifiable Information)
# redaction in cloud-native recruitment systems.
#
# Developed as part of the MSc Cloud Platform Programming module at NCI.
# Research motivation: Brookings Institution (2024) & MIT Sloan (Li et al., 2023)
# on Algorithmic Bias in Automated Hiring.

## Installation

```bash
pip install -e backend/app/libraries/sanitizer
```

## Usage

```python
from sanitizer import ResumeSanitizer

sanitizer = ResumeSanitizer()
clean_text = sanitizer.sanitize_text(resume_text)
```

## Purpose

This library strips PII (Names, Emails, Phone Numbers, LinkedIn URLs) from
resume text before it is sent to a cloud AI service (Google Gemini). This
implements the "Blind Hiring" technique recommended by academic research to
reduce Algorithmic Bias in recruitment systems.

## Features

- Email Redaction
- Phone Number Redaction
- LinkedIn URL Redaction
- Physical Address Redaction
- Configurable Mask Character (default: [REDACTED])
