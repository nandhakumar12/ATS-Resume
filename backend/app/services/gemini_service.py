"""
gemini_service.py
=================
Gemini AI Service with Error Resilience and XAI.
Includes automatic model discovery and retry logic for MSc stability.
"""

import os
import time
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiService:
    """
    Object-Oriented wrapper for the Google Gemini API.
    Handles rate limits (429) & model availability (404) for stable cloud demos.
    """

    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        # Updated model identifiers based on successful discovery
        self.models_to_try = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-1.5-flash",
            "models/gemini-flash-latest",
            "models/gemini-1.5-pro",
            "models/gemini-pro",
        ]
        logger.info("GeminiService initialized. Default models: %s", self.models_to_try)

    def analyze_resume(
        self,
        resume_text: str,
        job_description: str,
        job_title: str = "the role",
        retries: int = 1
    ) -> dict:
        """
        Send sanitized resume to Gemini. Uses discovery if hardcoded models fail.
        """
        
        # 1. TRY HARDCODED MODELS FIRST
        result = self._try_models(self.models_to_try, resume_text, job_description, job_title, retries)
        if result["score"] > 0:
            return result

        # 2. DISCOVERY MODE: If 404s/fails occur, find what's actually available on this key
        logger.info("Primary models failed. Entering Discovery Mode...")
        try:
            available_models = [m.name for m in genai.list_models() if "generateContent" in m.supported_generation_methods]
            logger.info("Discovered available models on this account: %s", available_models)
            
            # Filter for Gemini models we haven't tried yet
            new_models = [m for m in available_models if m not in self.models_to_try and "gemini" in m.lower()]
            if new_models:
                logger.info("Trying discovered models: %s", new_models)
                return self._try_models(new_models, resume_text, job_description, job_title, 0)
        except Exception as e:
            logger.error("Model discovery failed: %s", e)

        return result

    def _try_models(self, models, resume_text, job_description, job_title, retries):
        prompt = f"""
You are an expert ATS. Analyze the resume against the job description for '{job_title}'.
RESPONSE FORMAT:
SCORE: [0-100]
REASONING: [1-2 sentences]
STRENGTHS:
- [Skill 1]
IMPROVEMENTS:
- [Skill 1]
---
JOB: {job_description}
RESUME: {resume_text}
"""
        last_error = "Connection pending"
        for model_name in models:
            for attempt in range(retries + 1):
                try:
                    logger.info(f"Trying Gemini AI: {model_name} (Attempt {attempt+1})")
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    
                    if response and response.text:
                        return self._parse_response(response.text)
                except Exception as e:
                    last_error = str(e)
                    logger.warning(f"Error on {model_name}: {last_error}")
                    if "429" in last_error:
                        time.sleep(5)
                    elif "404" in last_error:
                        break # Try next model immediately
        
        return {"score": 0, "reasoning": f"AI unavailable. (Error: {last_error})", "strengths": [], "improvements": []}

    def _parse_response(self, text: str) -> dict:
        """Parse Gemini response with robust regex parsing."""
        import re
        res = {"score": 0, "reasoning": "No reasoning provided.", "strengths": [], "improvements": []}
        
        # Robust Score extraction (handles formatting like **SCORE**: 85 or SCORE: 85/100)
        score_match = re.search(r"SCORE:\s*(\d+)", text, re.IGNORECASE)
        if score_match:
            try: res["score"] = int(score_match.group(1))
            except: pass
            
        # Reasoning extraction
        reason_match = re.search(r"REASONING:\s*(.*)", text, re.IGNORECASE)
        if reason_match:
            res["reasoning"] = reason_match.group(1).strip()
            
        # Section-based parsing for lists
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        section = None
        for l in lines:
            if "STRENGTHS:" in l.upper(): 
                section = "strengths"
                continue
            if "IMPROVEMENTS:" in l.upper():
                section = "improvements"
                continue
            
            if section and l.startswith("-"):
                res[section].append(l[1:].strip())
        
        return res
