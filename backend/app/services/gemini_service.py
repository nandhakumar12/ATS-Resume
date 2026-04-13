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
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")
        
        genai.configure(api_key=api_key)
        
        self.models_to_try = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-pro",
        ]
        logger.info("GeminiService initialized with models: %s", self.models_to_try)

    def analyze_resume(
        self,
        resume_text: str,
        job_description: str,
        job_title: str = "the role",
        retries: int = 2
    ) -> dict:
        """
        Send sanitized resume to Gemini for analysis with fallback and backoff.
        """

        prompt = f"""
You are an expert Applicant Tracking System (ATS) specializing in professional recruitment. 
Analyze the provided anonymised resume against the job description for the role of '{job_title}'.
The resume has been anonymised for privacy and bias mitigation.

--- JOB DESCRIPTION ---
{job_description}

--- RESUME (ANONYMISED) ---
{resume_text}

--- REQUIRED RESPONSE FORMAT ---
You MUST provide your response in the exact format below:
SCORE: [An integer between 0 and 100]
REASONING: [1-2 sentences explaining the score]
STRENGTHS:
- [Matching Skill/Experience 1]
IMPROVEMENTS:
- [Missing Skill/Experience 1]

Ensure the STRENGTHS and IMPROVEMENTS sections use bullet points starting with "- ".
"""

        last_error = "All models failed"
        for model_name in self.models_to_try:
            for attempt in range(retries + 1):
                try:
                    logger.info(f"Attempting Gemini AI Analysis: model={model_name}, attempt={attempt+1}")
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    
                    if response and response.text:
                        logger.info(f"Received valid response from {model_name}")
                        return self._parse_response(response.text)
                    else:
                        logger.warning(f"Empty text response from {model_name}")
                
                except Exception as e:
                    last_error = str(e)
                    err_msg = last_error.lower()
                    if "429" in err_msg:
                        wait_time = (attempt + 1) * 12
                        logger.warning(f"Rate limit (429) on {model_name}. Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                    elif "404" in err_msg or "not found" in err_msg or "unsupported" in err_msg:
                        logger.warning(f"Model {model_name} unavailable: {e}. Trying different model...")
                        break
                    else:
                        logger.error(f"Gemini API Error ({model_name}): {e}")
                        if attempt < retries:
                            time.sleep(2)
                            continue
                        break

        logger.error(f"All Gemini AI models failed. Last error: {last_error}")
        return {
            "score": 0,
            "reasoning": f"AI analysis is currently unavailable. (Reason: {last_error})",
            "strengths": [],
            "improvements": []
        }

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
