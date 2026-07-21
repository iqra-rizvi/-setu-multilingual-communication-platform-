from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/templates", tags=["Templates"])


@router.get("/", response_model=list[schemas.TemplateOut])
def get_templates(
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Template).all()


@router.post("/", response_model=schemas.TemplateOut)
def create_template(
    payload: schemas.TemplateCreate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.require_roles(
        ["admin", "campaign_manager", "comms_team"]
    ))
):
    template = models.Template(
        name=payload.name,
        category=payload.category,
        content=payload.content,
        language=payload.language
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    return template


@router.get("/{template_id}", response_model=schemas.TemplateOut)
def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user)
):
    template = db.query(models.Template).filter(
        models.Template.id == template_id
    ).first()

    if not template:
        raise HTTPException(404, "Template not found")

    return template