from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# -------------------------------------------------
# CREATE BULLETIN
# -------------------------------------------------

class BulletinCreate(BaseModel):
    title: str
    content: str
    category: str
    priority: str = "Medium"
    target_location: Optional[str] = None
    languages: Optional[str] = None
    channels: Optional[str] = None
    expires_at: Optional[datetime] = None


# -------------------------------------------------
# UPDATE BULLETIN
# -------------------------------------------------

class BulletinUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    target_location: Optional[str] = None
    languages: Optional[str] = None
    channels: Optional[str] = None
    expires_at: Optional[datetime] = None


# -------------------------------------------------
# BULLETIN RESPONSE
# -------------------------------------------------

class BulletinResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    priority: str
    status: str

    target_location: Optional[str] = None
    languages: Optional[str] = None
    channels: Optional[str] = None

    created_at: datetime
    published_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True