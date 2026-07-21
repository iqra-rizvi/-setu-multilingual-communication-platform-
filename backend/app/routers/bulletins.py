from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import LiveBulletin
from ..bulletin import (
    BulletinCreate,
    BulletinUpdate,
    BulletinResponse,
)


router = APIRouter(
    prefix="/bulletins",
    tags=["Live Bulletins"],
)


# -------------------------------------------------
# GET ALL BULLETINS
# -------------------------------------------------

@router.get(
    "/",
    response_model=list[BulletinResponse],
)
def get_bulletins(
    db: Session = Depends(get_db),
):
    bulletins = (
        db.query(LiveBulletin)
        .order_by(
            LiveBulletin.created_at.desc()
        )
        .all()
    )

    return bulletins


# -------------------------------------------------
# GET SINGLE BULLETIN
# -------------------------------------------------

@router.get(
    "/{bulletin_id}",
    response_model=BulletinResponse,
)
def get_bulletin(
    bulletin_id: str,
    db: Session = Depends(get_db),
):
    bulletin = (
        db.query(LiveBulletin)
        .filter(
            LiveBulletin.id == bulletin_id
        )
        .first()
    )

    if not bulletin:
        raise HTTPException(
            status_code=404,
            detail="Bulletin not found",
        )

    return bulletin


# -------------------------------------------------
# CREATE BULLETIN
# -------------------------------------------------

@router.post(
    "/",
    response_model=BulletinResponse,
)
def create_bulletin(
    bulletin_data: BulletinCreate,
    db: Session = Depends(get_db),
):
    bulletin = LiveBulletin(
        title=bulletin_data.title,
        content=bulletin_data.content,
        category=bulletin_data.category,
        priority=bulletin_data.priority,
        status="Draft",
        target_location=bulletin_data.target_location,
        languages=bulletin_data.languages,
        channels=bulletin_data.channels,
        expires_at=bulletin_data.expires_at,
    )

    db.add(bulletin)
    db.commit()
    db.refresh(bulletin)

    return bulletin


# -------------------------------------------------
# UPDATE BULLETIN
# -------------------------------------------------

@router.put(
    "/{bulletin_id}",
    response_model=BulletinResponse,
)
def update_bulletin(
    bulletin_id: str,
    bulletin_data: BulletinUpdate,
    db: Session = Depends(get_db),
):
    bulletin = (
        db.query(LiveBulletin)
        .filter(
            LiveBulletin.id == bulletin_id
        )
        .first()
    )

    if not bulletin:
        raise HTTPException(
            status_code=404,
            detail="Bulletin not found",
        )

    update_data = bulletin_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            bulletin,
            field,
            value,
        )

    db.commit()
    db.refresh(bulletin)

    return bulletin


# -------------------------------------------------
# PUBLISH BULLETIN
# -------------------------------------------------

@router.post(
    "/{bulletin_id}/publish",
    response_model=BulletinResponse,
)
def publish_bulletin(
    bulletin_id: str,
    db: Session = Depends(get_db),
):
    bulletin = (
        db.query(LiveBulletin)
        .filter(
            LiveBulletin.id == bulletin_id
        )
        .first()
    )

    if not bulletin:
        raise HTTPException(
            status_code=404,
            detail="Bulletin not found",
        )

    bulletin.status = "Live"
    bulletin.published_at = datetime.utcnow()

    db.commit()
    db.refresh(bulletin)

    return bulletin


# -------------------------------------------------
# STOP BULLETIN
# -------------------------------------------------

@router.post(
    "/{bulletin_id}/stop",
    response_model=BulletinResponse,
)
def stop_bulletin(
    bulletin_id: str,
    db: Session = Depends(get_db),
):
    bulletin = (
        db.query(LiveBulletin)
        .filter(
            LiveBulletin.id == bulletin_id
        )
        .first()
    )

    if not bulletin:
        raise HTTPException(
            status_code=404,
            detail="Bulletin not found",
        )

    bulletin.status = "Stopped"

    db.commit()
    db.refresh(bulletin)

    return bulletin


# -------------------------------------------------
# DELETE BULLETIN
# -------------------------------------------------

@router.delete(
    "/{bulletin_id}",
)
def delete_bulletin(
    bulletin_id: str,
    db: Session = Depends(get_db),
):
    bulletin = (
        db.query(LiveBulletin)
        .filter(
            LiveBulletin.id == bulletin_id
        )
        .first()
    )

    if not bulletin:
        raise HTTPException(
            status_code=404,
            detail="Bulletin not found",
        )

    db.delete(bulletin)
    db.commit()

    return {
        "message": "Bulletin deleted successfully",
    }