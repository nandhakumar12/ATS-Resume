import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import auth, resume, jobs

import logging
import json
from datetime import datetime

os.makedirs("uploads", exist_ok=True)
load_dotenv()

# --- Professional JSON Logging ---
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        return json.dumps(log_entry)

logger = logging.getLogger()
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

def create_app() -> FastAPI:
    app = FastAPI(
        title="AI-Powered ATS Platform",
        version="0.1.0",
        description="AI-powered Applicant Tracking System backend service.",
    )

    # --- Platform Health Check ---
    @app.get("/api/health")
    def health_check():
        return {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "service": "backend"}

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(resume.router, prefix="/api/resumes", tags=["resumes"])
    app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])

    app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

    return app


app = create_app()

