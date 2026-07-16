from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ---------- Auth ----------

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "comms_team"
    organization: str = ""


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str
    organization: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Recipients / Audience ----------

class RecipientCreate(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    language: str = "English"
    state: str = ""
    city: str = ""
    occupation: str = ""
    organization: str = ""
    org_hierarchy: str = ""


class RecipientOut(RecipientCreate):
    id: str
    engagement_score: float

    class Config:
        from_attributes = True


class SegmentFilter(BaseModel):
    language: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    occupation: Optional[str] = None
    organization: Optional[str] = None


# ---------- Templates ----------

class TemplateCreate(BaseModel):
    name: str
    category: str = "announcement"
    content: str = ""
    language: str = "English"


class TemplateOut(TemplateCreate):
    id: str

    class Config:
        from_attributes = True


# ---------- Campaigns ----------

class CampaignCreate(BaseModel):
    name: str
    description: str = ""
    type: str = "announcement"
    segment_filter: SegmentFilter = SegmentFilter()
    channels: List[str] = []


class CampaignOut(BaseModel):
    id: str
    name: str
    description: str
    type: str
    status: str
    channels: str
    created_at: datetime
    scheduled_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- AI Content ----------

class GenerateContentRequest(BaseModel):
    campaign_id: str
    brief: str
    tone: str = "informative"  # informative | urgent | friendly | formal


class TranslateRequest(BaseModel):
    campaign_id: str
    source_content: str
    tone: str = "informative"
    target_languages: List[str] = ["Hindi"]


class PersonalizeRequest(BaseModel):
    content: str
    recipient_id: str


class SentimentRequest(BaseModel):
    text: str


class CampaignContentOut(BaseModel):
    id: str
    campaign_id: str
    language: str
    tone: str
    content: str
    generated_by_ai: bool
    sentiment_score: Optional[float] = None
    compliance_ok: bool
    compliance_notes: str

    class Config:
        from_attributes = True


# ---------- Distribution ----------

class SendRequest(BaseModel):
    campaign_id: str
    channels: List[str]


class MessageOut(BaseModel):
    id: str
    campaign_id: str
    recipient_id: str
    channel: str
    language: str
    content: str
    status: str

    class Config:
        from_attributes = True


class TrackEventRequest(BaseModel):
    message_id: str
    event_type: str  # open | click | response | feedback
    comment: str = ""
