"""
Quick end-to-end test for the Gemini AI integration.
Run this from the project root: python test_gemini.py
"""
import sys
import os
import time

print("--- INITIALIZING TEST ENVIRONMENT ---")

# Robust .env loading
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip().strip('"').strip("'")
    print(f"✅ Loaded .env from {env_path}")

# Add sanitizer library to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'app', 'libraries', 'sanitizer', 'src'))
# Add backend app to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

try:
    from sanitizer import ResumeSanitizer
    from app.services.gemini_service import GeminiService
    print("✅ All imports successful.")
except Exception as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

SAMPLE_RESUME = """
John Smith
john.smith@gmail.com | +353 087 123 4567 | linkedin.com/in/johnsmith
Dublin, Ireland

EXPERIENCE
Software Engineer - TechCorp (2021 - Present)
- Developed REST APIs using Python and FastAPI
- Deployed applications on AWS using EC2 and S3
- Used Docker and GitHub Actions for CI/CD pipelines
- Experience with DynamoDB and PostgreSQL
"""

SAMPLE_JD = """
We are looking for a Cloud Engineer with:
- 2+ years of Python and cloud development experience
- Strong knowledge of AWS services (EC2, S3, Lambda, DynamoDB)
- Experience with containerisation (Docker, Kubernetes)
- CI/CD pipeline experience (GitHub Actions, Jenkins)
- FastAPI or Django REST framework experience
"""

def main():
    print("\n" + "=" * 50)
    print("Step 1: Running CloudResumeSanitizer...")
    sanitizer = ResumeSanitizer()
    sanitized = sanitizer.sanitize_text(SAMPLE_RESUME)
    
    if "[REDACTED]" in sanitized:
        print("✅ PII Redacted Successfully.")
    else:
        print("❌ Sanitization Failed.")

    print("\n" + "=" * 50)
    print("Step 2: Running Gemini AI Analysis...")
    print("(Waiting 3 seconds to avoid rate limiting...)")
    time.sleep(3)
    
    try:
        gemini = GeminiService()
        result = gemini.analyze_resume(sanitized, SAMPLE_JD, "Cloud Engineer")

        # Verify output
        if result['score'] > 0:
            print(f"\n✅ AI Score        : {result['score']} / 100")
            print(f"✅ AI Reasoning    : {result['reasoning']}")
            print(f"✅ Key Strengths   :")
            for s in result.get('strengths', []):
                print(f"    + {s}")
            print("\n🏆 Full Gemini + Sanitizer pipeline test passed!")
        else:
            print(f"\n⚠️ AI Analysis failed with score 0.")
            print(f"Reasoning: {result['reasoning']}")
    except Exception as e:
        print(f"❌ Critical Test Failure: {e}")

    print("\n--- TEST COMPLETE ---")

if __name__ == "__main__":
    main()
