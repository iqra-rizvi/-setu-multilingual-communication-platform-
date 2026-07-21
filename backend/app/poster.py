from pydantic import BaseModel


class PosterCreate(BaseModel):

    campaign_id:str
    title:str
    language:str
    content:str



class PosterResponse(PosterCreate):

    id:str

    class Config:
        from_attributes = True