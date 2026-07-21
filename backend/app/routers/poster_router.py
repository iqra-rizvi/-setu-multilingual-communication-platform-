from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Poster
from app.poster import PosterCreate


router = APIRouter(
    prefix="/posters",
    tags=["Posters"]
)


@router.post("/")
def create_poster(
    poster: PosterCreate,
    db: Session = Depends(get_db)
):

    new_poster = Poster(
        campaign_id=poster.campaign_id,
        title=poster.title,
        language=poster.language,
        content=poster.content
    )


    db.add(new_poster)
    db.commit()
    db.refresh(new_poster)

    return new_poster