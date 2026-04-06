import re
import logging

class ResumeSanitizer:
    """
    CloudResumeSanitizer: A professional OOP library for PII (Personally Identifiable Information) 
    redaction in recruitment documents.
    
    This library satisfies the LO3 requirement of the Cloud Platform Programming module (NCI).
    """

    def __init__(self, mask_char: str = "[REDACTED]"):
        self.mask_char = mask_char
        self.logger = logging.getLogger(__name__)
        
        # Define PII patterns (RegEx)
        self.patterns = {
            "email": r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            "phone": r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
            "linkedin": r'linkedin\.com/in/[a-zA-Z0-9_-]+/?',
            "address": r'\d{1,5}\s\w+\s(?:St|Ave|Rd|Blvd|Ln|Dr|Way|Ct|Pl)\.?'
        }

    def sanitize_text(self, text: str) -> str:
        """
        Main entry point to sanitize text by redacting all identified PII patterns.
        """
        if not text:
            return ""

        sanitized_text = text
        for pii_type, pattern in self.patterns.items():
            count = len(re.findall(pattern, sanitized_text))
            if count > 0:
                self.logger.info(f"Redacting {count} instances of {pii_type}")
                sanitized_text = re.sub(pattern, self.mask_char, sanitized_text)
        
        return sanitized_text

    def get_summary(self, original_text: str, sanitized_text: str) -> dict:
        """
        Returns a summary of the redaction process (for the MSc report).
        """
        return {
            "original_length": len(original_text),
            "sanitized_length": len(sanitized_text),
            "changes_made": original_text != sanitized_text
        }
