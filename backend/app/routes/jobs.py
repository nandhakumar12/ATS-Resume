import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.database.dynamodb import jobs_table
from app.models.resume import JobCreate, JobResponse
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()



@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    table = jobs_table()
    job_id = str(uuid.uuid4())
    item = {
        "job_id": job_id,
        "title": job_in.title,
        "description": job_in.description,
        "created_by": str(current_user.id),
    }
    table.put_item(Item=item)
    return JobResponse(
        id=job_id,
        title=job_in.title,
        description=job_in.description,
        created_by=str(current_user.id),
    )



@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    current_user: User = Depends(get_current_user),
) -> List[JobResponse]:
    table = jobs_table()
    resp = table.scan()
    return [
        JobResponse(
            id=i.get("job_id", ""),
            title=i.get("title", ""),
            description=i.get("description", ""),
            created_by=i.get("created_by", ""),
        )
        for i in resp.get("Items", [])
    ]



@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str = Path(...),
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    table = jobs_table()
    resp = table.get_item(Key={"job_id": job_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobResponse(
        id=item.get("job_id", ""),
        title=item.get("title", ""),
        description=item.get("description", ""),
        created_by=item.get("created_by", ""),
    )



@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_in: JobCreate,
    job_id: str = Path(...),
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    table = jobs_table()
    resp = table.get_item(Key={"job_id": job_id})
    if not resp.get("Item"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    table.update_item(
        Key={"job_id": job_id},
        UpdateExpression="SET title = :t, description = :d",
        ExpressionAttributeValues={":t": job_in.title, ":d": job_in.description},
    )
    return JobResponse(
        id=job_id,
        title=job_in.title,
        description=job_in.description,
        created_by=str(current_user.id),
    )



@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str = Path(...),
    current_user: User = Depends(get_current_user),
) -> None:
    table = jobs_table()
    resp = table.get_item(Key={"job_id": job_id})
    if not resp.get("Item"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    table.delete_item(Key={"job_id": job_id})
