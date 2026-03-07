from typing import List


from fastapi import APIRouter, UploadFile, File

from app.models.resume import ResumeCreate, ResumeResponse, ResumeScoreResponse
from app.services.parser_service import parse_resume_file
from app.services.scoring_engine import score_resume_against_job
from app.services.similarity_engine import compute_semantic_similarity
from app.database.dynamodb import resumes_table


router = APIRouter()


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
) -> ResumeResponse:
    parsed = await parse_resume_file(file)
    table = resumes_table()
    # For local demo we don't require auth; use a simple synthetic owner id.
    owner_id = "demo-user"
    resume_id = f"{owner_id}#{file.filename}"
    item = {
        "resume_id": resume_id,
        "owner_id": owner_id,
        "filename": file.filename,
        "parsed_data": parsed,
    }
    table.put_item(Item=item)
    return ResumeResponse(id=1, owner_id=1, filename=file.filename, parsed_data=parsed)


@router.post("/score", response_model=ResumeScoreResponse)
async def score_resume(
    payload: ResumeCreate,
) -> ResumeScoreResponse:
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


@router.get("/history", response_model=List[ResumeResponse])
async def list_resumes(
) -> List[ResumeResponse]:
    table = resumes_table()
    resp = table.scan()  # PoC; later narrow to owner_id with GSI
    items = resp.get("Items", [])
    results: List[ResumeResponse] = []
    for i in items:
        results.append(
            ResumeResponse(
                id=1,
                owner_id=1,
                filename=i.get("filename", ""),
                parsed_data=i.get("parsed_data", {}),
            )
        )
    return results

