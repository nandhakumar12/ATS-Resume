import json
import uuid
from decimal import Decimal
from typing import Any, Dict, List

from fastapi import APIRouter, File, HTTPException, Path, UploadFile, status

from app.database.dynamodb import resumes_table
from app.models.resume import ResumeCreate, ResumeResponse, ResumeScoreResponse
from app.services.parser_service import parse_resume_file
from app.services.scoring_engine import score_resume_against_job
from app.services.similarity_engine import compute_semantic_similarity

router = APIRouter()

OWNER_ID = "demo-user"  # Replace with current_user.id once auth is wired


# ── helpers ──────────────────────────────────────────────────────────────────

def _to_decimal(obj: Any) -> Any:
    """Recursively convert floats → Decimal for DynamoDB."""
    return json.loads(json.dumps(obj), parse_float=Decimal)


def _from_decimal(obj: Any) -> Any:
    """Recursively convert Decimal → float for JSON serialisation."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: _from_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_from_decimal(i) for i in obj]
    return obj


def _item_to_response(item: Dict) -> ResumeResponse:
    return ResumeResponse(
        id=item.get("resume_id", ""),
        owner_id=item.get("owner_id", ""),
        filename=item.get("filename", ""),
        parsed_data=_from_decimal(item.get("parsed_data", {})),
    )


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(file: UploadFile = File(...)) -> ResumeResponse:
    parsed = await parse_resume_file(file)
    table = resumes_table()

    resume_id = str(uuid.uuid4())
    item = {
        "resume_id": resume_id,
        "owner_id": OWNER_ID,
        "filename": file.filename,
        "parsed_data": _to_decimal(parsed),
    }
    table.put_item(Item=item)

    return ResumeResponse(
        id=resume_id, owner_id=OWNER_ID, filename=file.filename, parsed_data=parsed
    )


# ── READ (list) ───────────────────────────────────────────────────────────────

@router.get("/history", response_model=List[ResumeResponse])
async def list_resumes() -> List[ResumeResponse]:
    table = resumes_table()
    resp = table.scan()
    return [_item_to_response(i) for i in resp.get("Items", [])]


# ── READ (single) ─────────────────────────────────────────────────────────────

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: str = Path(...)) -> ResumeResponse:
    table = resumes_table()
    resp = table.get_item(Key={"resume_id": resume_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return _item_to_response(item)


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.patch("/{resume_id}/skills", response_model=ResumeResponse)
async def update_resume_skills(
    resume_id: str = Path(...),
    payload: Dict[str, List[str]] = None,
) -> ResumeResponse:
    """
    Patch the skills list on a stored resume.
    Body: { "skills": ["python", "docker", "aws ec2"] }
    """
    if payload is None or "skills" not in payload:
        raise HTTPException(status_code=400, detail="Body must contain 'skills' list")

    table = resumes_table()
    resp = table.get_item(Key={"resume_id": resume_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Merge new skills into parsed_data
    parsed = _from_decimal(item.get("parsed_data", {}))
    parsed["skills"] = list({*(parsed.get("skills") or []), *payload["skills"]})
    parsed["_custom_skills"] = payload["skills"]

    table.update_item(
        Key={"resume_id": resume_id},
        UpdateExpression="SET parsed_data = :pd",
        ExpressionAttributeValues={":pd": _to_decimal(parsed)},
    )
    return ResumeResponse(
        id=resume_id,
        owner_id=item.get("owner_id", ""),
        filename=item.get("filename", ""),
        parsed_data=parsed,
    )


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(resume_id: str = Path(...)) -> None:
    import os
    table = resumes_table()
    resp = table.get_item(Key={"resume_id": resume_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Also remove uploaded PDF if it exists
    file_url: str = (item.get("parsed_data") or {}).get("file_url", "")
    if file_url:
        local_path = file_url.lstrip("/api/")  # e.g. uploads/xyz.pdf
        if os.path.exists(local_path):
            os.remove(local_path)

    table.delete_item(Key={"resume_id": resume_id})


# ── SCORE ─────────────────────────────────────────────────────────────────────

@router.post("/score", response_model=ResumeScoreResponse)
async def score_resume(payload: ResumeCreate) -> ResumeScoreResponse:
    semantic = compute_semantic_similarity(payload.resume_text, payload.job_description)
    score = score_resume_against_job(payload.resume_text, payload.job_description)
    return ResumeScoreResponse(
        resume_id=payload.resume_id,
        job_id=payload.job_id,
        overall_score=score.overall_score,
        semantic_similarity=semantic,
        skill_match=score.skill_match,
        experience_alignment=score.experience_alignment,
        keyword_score=score.keyword_score,
        matched_skills=score.matched_skills,
        missing_skills=score.missing_skills,
        recommendation=score.recommendation,
    )
