import os
import google.generativeai as genai

def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY is not set in the environment.")
        return

    print(f"Testing Gemini API Key: {api_key[:10]}...")
    genai.configure(api_key=api_key)
    
    models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
    
    for model_name in models:
        try:
            print(f"Checking model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello, this is a diagnostic test. Please reply with 'OK'.")
            if response and response.text:
                print(f"✅ SUCCESS: Model {model_name} responded: {response.text.strip()}")
                return
        except Exception as e:
            print(f"❌ FAILED: Model {model_name} error: {e}")

    print("\nConclusion: All tested models failed. This usually means the API key is invalid, restricted, or quota-limited.")

if __name__ == "__main__":
    test_gemini()
