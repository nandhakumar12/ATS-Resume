import os
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse

from app.services.auth_service import get_current_user, get_cognito_settings
from app.models.user import User


router = APIRouter()


def _cognito_base_url() -> str:
    settings = get_cognito_settings()
    domain = os.getenv("COGNITO_DOMAIN", "")
    return f"https://{domain}"


@router.get("/login")
async def cognito_login():
    """Redirect browser to Cognito Hosted UI login page."""
    settings = get_cognito_settings()
    base = _cognito_base_url()
    redirect_uri = os.getenv("COGNITO_REDIRECT_URI", "http://localhost/api/auth/callback")
    url = (
        f"{base}/oauth2/authorize"
        f"?client_id={settings.app_client_id}"
        f"&response_type=code"
        f"&scope=email+openid+profile"
        f"&redirect_uri={redirect_uri}"
    )
    return RedirectResponse(url)


@router.get("/logout")
async def cognito_logout():
    """Redirect browser to Cognito logout page."""
    settings = get_cognito_settings()
    base = _cognito_base_url()
    logout_uri = os.getenv("COGNITO_LOGOUT_URI", "http://localhost")
    url = (
        f"{base}/logout"
        f"?client_id={settings.app_client_id}"
        f"&logout_uri={logout_uri}"
    )
    return RedirectResponse(url)


@router.get("/callback")
async def cognito_callback(code: str):
    """
    Exchange Cognito authorization code for tokens.
    Returns the access + id tokens to the client.
    """
    import httpx
    settings = get_cognito_settings()
    base = _cognito_base_url()
    redirect_uri = os.getenv("COGNITO_REDIRECT_URI", "http://localhost/api/auth/callback")
    client_id = settings.app_client_id
    client_secret = os.getenv("COGNITO_APP_CLIENT_SECRET", "")

    token_url = f"{base}/oauth2/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    auth = (client_id, client_secret) if client_secret else None

    async with httpx.AsyncClient() as client:
        resp = await client.post(token_url, data=data, headers=headers, auth=auth)

    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=resp.json())

    tokens = resp.json()
    return {
        "access_token": tokens.get("access_token"),
        "id_token": tokens.get("id_token"),
        "refresh_token": tokens.get("refresh_token"),
        "token_type": "Bearer",
    }



@router.get("/me", response_model=Dict[str, Any])
async def read_users_me(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Return information about the currently authenticated Cognito user."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
    }
