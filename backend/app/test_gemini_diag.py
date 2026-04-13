import os
import google.generativeai as genai

def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY is not set in the environment.")
        return

    print(f"Testing Gemini API Key: {api_key[:10]}...")
    genai.configure(api_key=api_key)
    
    print("\n--- Model Discovery ---")
    try:
        visible_models = [m.name for m in genai.list_models() if "generateContent" in m.supported_generation_methods]
        print(f"✅ Models authorized for this key: {visible_models}")
        if not visible_models:
            print("⚠️ WARNING: No models found with 'generateContent' capability. Check API restrictions.")
    except Exception as e:
        print(f"❌ ERROR: Could not list models: {e}")
        visible_models = []

    models_to_test = ["models/gemini-1.5-flash", "models/gemini-1.5-pro", "models/gemini-pro"]
    # Add discovered models to the list
    for m in visible_models:
        if m not in models_to_test: models_to_test.append(m)

    print("\n--- Connectivity Test ---")
    for model_name in models_to_test:
        try:
            print(f"Checking model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello, diagnostic test. Reply with 'READY'.")
            if response and response.text:
                print(f"✅ SUCCESS: {model_name} responded: {response.text.strip()}")
                return
        except Exception as e:
            print(f"❌ FAILED: {model_name}: {e}")

    print("\nConclusion: All tested models failed. This usually means the API key is invalid, restricted, or quota-limited.")

if __name__ == "__main__":
    test_gemini()
