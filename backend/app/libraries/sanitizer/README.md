# CloudResumeSanitizer
# ====================
# A professional OOP library for PII (Personally Identifiable Information)
# redaction in cloud-native recruitment systems.

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
resume text before it is processed by cloud-based AI engines.

## Features

- Email Redaction
- Phone Number Redaction
- LinkedIn URL Redaction
- Physical Address Redaction
- Configurable Mask Character (default: [REDACTED])
