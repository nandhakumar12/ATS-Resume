import sys
import os

# Add the library src to the path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'app', 'libraries', 'sanitizer', 'src'))

from sanitizer import ResumeSanitizer

def test_sanitizer():
    sanitizer = ResumeSanitizer()
    
    test_text = """
    John Doe
    Email: john.doe@example.com
    Phone: +353 123 456 7890
    LinkedIn: linkedin.com/in/johndoe
    Address: 123 Innovation St.
    Experience: Worked as a Python Developer for 5 years.
    """
    
    print("--- Original Text ---")
    print(test_text)
    
    sanitized = sanitizer.sanitize_text(test_text)
    
    print("\n--- Sanitized Text (Privacy Protected) ---")
    print(sanitized)
    
    summary = sanitizer.get_summary(test_text, sanitized)
    print("\n--- Redaction Summary ---")
    print(summary)
    
    assert "john.doe@example.com" not in sanitized
    assert "linkedin.com/in/johndoe" not in sanitized
    assert "[REDACTED]" in sanitized
    print("\n✅ All Tests Passed! CloudResumeSanitizer is working correctly.")

if __name__ == "__main__":
    test_sanitizer()
