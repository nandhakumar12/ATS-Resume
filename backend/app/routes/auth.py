from typing import Any, Dict

from fastapi import APIRouter, Depends

from app.services.auth_service import get_current_user
from app.models.user import User


router = APIRouter()


@router.get("/me", response_model=Dict[str, Any])
async def read_users_me(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Return information about the currently authenticated user.
    Authentication and tokens are issued by Amazon Cognito; this API only validates them.
    """
    return {"email": current_user.email, "role": current_user.role}

