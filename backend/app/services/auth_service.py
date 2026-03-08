import os
from functools import lru_cache
from typing import Optional

import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.models.user import User, UserRole


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")  # token endpoint handled by Cognito, not this API


class CognitoSettings:
    def __init__(self) -> None:
        self.region = os.getenv("COGNITO_REGION", "us-east-1")
        self.user_pool_id = os.getenv("COGNITO_USER_POOL_ID", "")
        self.app_client_id = os.getenv("COGNITO_APP_CLIENT_ID", "")

    @property
    def issuer(self) -> str:
        return f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}"

    @property
    def jwks_url(self) -> str:
        return f"{self.issuer}/.well-known/jwks.json"


@lru_cache(maxsize=1)
def get_cognito_settings() -> CognitoSettings:
    return CognitoSettings()


@lru_cache(maxsize=1)
def get_jwks() -> dict:
    settings = get_cognito_settings()
    resp = requests.get(settings.jwks_url, timeout=5)
    resp.raise_for_status()
    return resp.json()


def _get_cognito_public_key(token: str) -> Optional[dict]:
    jwks = get_jwks()
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    if not kid:
        return None
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    settings = get_cognito_settings()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate Cognito token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    key = _get_cognito_public_key(token)
    if key is None:
        raise credentials_exception

    try:
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.app_client_id,
            issuer=settings.issuer,
        )
    except JWTError:
        raise credentials_exception

    email = payload.get("email") or payload.get("username") or payload.get("cognito:username")
    if email is None:
        raise credentials_exception

    role_str = payload.get("custom:role", "candidate")
    try:
        role = UserRole(role_str)
    except ValueError:
        role = UserRole.CANDIDATE

    user_id = payload.get("sub", "demo-user")
    return User(id=user_id, email=email, full_name=payload.get("name"), role=role, is_active=True)

