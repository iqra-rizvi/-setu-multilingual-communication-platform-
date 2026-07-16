import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(tags=["Audience & Campaign Planning"])


# ---------- Recipients (Audience) ----------

@router.post("/recipients", response_model=schemas.RecipientOut)
def add_recipient(
    payload: schemas.RecipientCreate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user),
):
    r = models.Recipient(**payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.get("/recipients", response_model=List[schemas.RecipientOut])
def list_recipients(
    language: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    occupation: Optional[str] = None,
    organization: Optional[str] = None,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Recipient)
    if language:
        q = q.filter(models.Recipient.language == language)
    if state:
        q = q.filter(models.Recipient.state == state)
    if city:
        q = q.filter(models.Recipient.city == city)
    if occupation:
        q = q.filter(models.Recipient.occupation == occupation)
    if organization:
        q = q.filter(models.Recipient.organization == organization)
    return q.all()


@router.delete("/recipients/{recipient_id}")
def delete_recipient(
    recipient_id: str,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.require_roles(["admin", "campaign_manager"])),
):
    r = db.query(models.Recipient).filter(models.Recipient.id == recipient_id).first()
    if not r:
        raise HTTPException(404, "Recipient not found")
    db.delete(r)
    db.commit()
    return {"deleted": True}


@router.get("/recipients/segments/options")
def segment_options(db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)):
    """Returns distinct values for each segmentation dimension, to populate filter dropdowns."""
    def distinct(col):
        return sorted({v[0] for v in db.query(col).distinct().all() if v[0]})

    return {
        "languages": distinct(models.Recipient.language),
        "states": distinct(models.Recipient.state),
        "cities": distinct(models.Recipient.city),
        "occupations": distinct(models.Recipient.occupation),
        "organizations": distinct(models.Recipient.organization),
    }


# ---------- Templates ----------

@router.post("/templates", response_model=schemas.TemplateOut)
def create_template(
    payload: schemas.TemplateCreate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.require_roles(["admin", "campaign_manager"])),
):
    t = models.Template(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/templates", response_model=List[schemas.TemplateOut])
def list_templates(db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Template).all()


# ---------- Campaigns ----------

@router.post("/campaigns", response_model=schemas.CampaignOut)
def create_campaign(
    payload: schemas.CampaignCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_roles(["admin", "campaign_manager"])),
):
    c = models.Campaign(
        name=payload.name,
        description=payload.description,
        type=payload.type,
        created_by=user.id,
        segment_filter=json.dumps(payload.segment_filter.model_dump()),
        channels=",".join(payload.channels),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/campaigns", response_model=List[schemas.CampaignOut])
def list_campaigns(db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Campaign).order_by(models.Campaign.created_at.desc()).all()


@router.get("/campaigns/{campaign_id}", response_model=schemas.CampaignOut)
def get_campaign(
    campaign_id: str, db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)
):
    c = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(404, "Campaign not found")
    return c


@router.get("/campaigns/{campaign_id}/audience", response_model=List[schemas.RecipientOut])
def campaign_audience(
    campaign_id: str, db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)
):
    """Resolve the campaign's stored segmentation filter into a live recipient list."""
    c = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(404, "Campaign not found")
    filt = json.loads(c.segment_filter or "{}")
    q = db.query(models.Recipient)
    for field in ["language", "state", "city", "occupation", "organization"]:
        val = filt.get(field)
        if val:
            q = q.filter(getattr(models.Recipient, field) == val)
    return q.all()
