import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import auth, resume, jobs
from app.services.secrets_service import inject_secrets

os.makedirs("uploads", exist_ok=True)

load_dotenv()
inject_secrets()


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI-Powered ATS Platform",
        version="0.1.0",
        description="MSc-level AI-powered Applicant Tracking System (Architecture B).",
    )

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

