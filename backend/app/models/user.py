from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.CANDIDATE


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool = True


class Token(BaseModel):
    access_token: str
    token_type: str

