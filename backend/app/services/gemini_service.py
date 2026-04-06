"""
gemini_service.py
=================
Gemini AI Service with Error Resilience and XAI.
Includes automatic model discovery and retry logic for MSc stability.
"""

import os
import time
import logging
from google import genai
from google.genai import errors

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
        
        self.client = genai.Client(api_key=api_key)
        # Using stable/latest aliases from the verified models list
        self.models_to_try = [
            "models/gemini-flash-latest",
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash"
        ]
        logger.info("GeminiService initialized.")

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
You are an expert Applicant Tracking System (ATS). 
Analyze the following anonymised resume against the job description for the role of '{job_title}'.
The resume has been anonymised for privacy and bias mitigation.

--- JOB DESCRIPTION ---
{job_description}

--- RESUME (ANONYMISED) ---
{resume_text}

--- REQUIRED RESPONSE FORMAT ---
SCORE: [0-100]
REASONING: [1-2 sentences]
STRENGTHS:
- [Matching Skill/Experience 1]
IMPROVEMENTS:
- [Missing Skill/Experience 1]
"""

        for model_name in self.models_to_try:
            for attempt in range(retries + 1):
                try:
                    logger.info(f"Analyzing with {model_name} (Attempt {attempt+1})...")
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    
                    if response and response.text:
                        return self._parse_response(response.text)
                
                except Exception as e:
                    err_msg = str(e).lower()
                    if "429" in err_msg:
                        # Rate limit: Wait and retry
                        wait_time = (attempt + 1) * 10
                        logger.warning(f"Rate limit (429) on {model_name}. Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                    elif "404" in err_msg or "not found" in err_msg:
                        logger.warning(f"Model ID {model_name} not recognized. Trying next model...")
                        break # Try next model
                    else:
                        logger.error(f"Gemini API Exception ({model_name}): {e}")
                        break

        return {
            "score": 0,
            "reasoning": "AI analysis unavailable (Rate limit or model connection error).",
            "strengths": [],
            "improvements": []
        }

    def _parse_response(self, text: str) -> dict:
        """Parse Gemini response into a structured dictionary."""
        res = {"score": 0, "reasoning": "No reasoning provided.", "strengths": [], "improvements": []}
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        section = None
        for l in lines:
            if l.startswith("SCORE:"):
                try: res["score"] = int(l.split(":")[1].strip().split("/")[0])
                except: pass
            elif l.startswith("REASONING:"):
                res["reasoning"] = l.split(":")[1].strip()
                section = "reasoning"
            elif l.startswith("STRENGTHS:"): section = "strengths"
            elif l.startswith("IMPROVEMENTS:"): section = "improvements"
            elif l.startswith("- ") and section in ("strengths", "improvements"):
                res[section].append(l[2:].strip())
        return res
