from typing import List

from fastapi import APIRouter, Depends

from app.models.resume import JobCreate, JobResponse
from app.services.auth_service import get_current_user
from app.models.user import User
from app.database.dynamodb import jobs_table


router = APIRouter()


@router.post("/", response_model=JobResponse)
async def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    table = jobs_table()
    job_id = job_in.title  # PoC; replace with ULID/UUID
    item = {
        "job_id": job_id,
        "title": job_in.title,
        "description": job_in.description,
        "created_by": str(current_user.id),
    }
    table.put_item(Item=item)
    return JobResponse(id=1, title=job_in.title, description=job_in.description, created_by=current_user.id)


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    current_user: User = Depends(get_current_user),
) -> List[JobResponse]:
    table = jobs_table()
    resp = table.scan()
    items = resp.get("Items", [])
    return [
        JobResponse(
            id=1,
            title=i.get("title", ""),
            description=i.get("description", ""),
            created_by=int(i.get("created_by", "0")),
        )
        for i in items
    ]

