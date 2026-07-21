import random
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth, ai_service
from ..database import get_db

router = APIRouter(prefix="/distribution", tags=["Distribution & Analytics"])


@router.post("/send", response_model=List[schemas.MessageOut])
async def send_campaign(
    payload: schemas.SendRequest,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.require_roles(["admin", "campaign_manager", "comms_team"])),
):
    """
    Simulates fan-out delivery of a campaign's AI-generated / translated content
    across the requested channels to every recipient matching the campaign's
    audience segmentation. Each recipient's message is personalized (via the
    AI service) using the content in their preferred language before being
    "delivered". In production the actual send step would call real Email/
    SMS/WhatsApp Business/Push provider APIs; here we simulate realistic
    delivery outcomes so the analytics pipeline (Module 3) has data to work
    with, while the content itself is genuinely AI-generated and personalized.
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == payload.campaign_id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    import json
    filt = json.loads(campaign.segment_filter or "{}")
    q = db.query(models.Recipient)
    for field in ["language", "state", "city", "occupation", "organization"]:
        val = filt.get(field)
        if val:
            q = q.filter(getattr(models.Recipient, field) == val)
    recipients = q.all()

    if not recipients:
        raise HTTPException(400, "No recipients match this campaign's audience segment")

    contents = db.query(models.CampaignContent).filter(
        models.CampaignContent.campaign_id == campaign.id
    ).all()
    content_by_lang = {c.language: c.content for c in contents}
    default_content = contents[0].content if contents else campaign.description

    created_messages = []
    for recipient in recipients:
        lang_content = content_by_lang.get(recipient.language, default_content)
        personalized = await ai_service.personalize_content(
    lang_content,
    recipient.name,
    recipient.occupation,
    recipient.organization,
    recipient.language,
    recipient.state,
    recipient.city,
    recipient.engagement_score,
)
        for channel in payload.channels:
            status = random.choices(
                [models.MessageStatusEnum.delivered, models.MessageStatusEnum.sent, models.MessageStatusEnum.failed],
                weights=[0.75, 0.15, 0.10],
            )[0]
            msg = models.Message(
                campaign_id=campaign.id,
                recipient_id=recipient.id,
                channel=channel,
                language=recipient.language,
                content=personalized,
                status=status,
                sent_at=datetime.utcnow(),
            )
            db.add(msg)
            created_messages.append(msg)

    campaign.status = models.CampaignStatusEnum.completed
    campaign.channels = ",".join(payload.channels)
    db.commit()
    for m in created_messages:
        db.refresh(m)
    return created_messages


@router.post("/track")
async def track_event(
    payload: schemas.TrackEventRequest,
    db: Session = Depends(get_db),
):
    """Webhook-style endpoint simulating opens/clicks/responses/feedback from recipients."""
    msg = db.query(models.Message).filter(models.Message.id == payload.message_id).first()
    if not msg:
        raise HTTPException(404, "Message not found")

    now = datetime.utcnow()
    if payload.event_type == "open":
        msg.status = models.MessageStatusEnum.opened
        msg.opened_at = now
    elif payload.event_type == "click":
        msg.status = models.MessageStatusEnum.clicked
        msg.clicked_at = now

    sentiment_label = ""
    if payload.comment:
        result = await ai_service.analyze_sentiment(payload.comment)
        sentiment_label = result["label"]

    event = models.EngagementEvent(
        message_id=msg.id,
        event_type=payload.event_type,
        sentiment=sentiment_label,
        comment=payload.comment,
    )
    db.add(event)

    # nudge recipient engagement score
    recipient = db.query(models.Recipient).filter(models.Recipient.id == msg.recipient_id).first()
    if recipient:
        bump = {"open": 0.5, "click": 1.0, "response": 1.5, "feedback": 1.0}.get(payload.event_type, 0.2)
        recipient.engagement_score = round((recipient.engagement_score or 0) + bump, 2)

    db.commit()
    return {"tracked": True, "sentiment": sentiment_label}


@router.get("/status/{campaign_id}")
def delivery_status(
    campaign_id: str, db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)
):
    messages = db.query(models.Message).filter(models.Message.campaign_id == campaign_id).all()
    counts = {}
    for m in messages:
        counts[m.status.value] = counts.get(m.status.value, 0) + 1
    channel_counts = {}
    for m in messages:
        channel_counts[m.channel.value] = channel_counts.get(m.channel.value, 0) + 1
    return {"total": len(messages), "by_status": counts, "by_channel": channel_counts}


@router.get("/messages/{campaign_id}", response_model=List[schemas.MessageOut])
def list_messages(
    campaign_id: str,
    limit: int = 20,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user),
):
    """Returns actual delivered (personalized) message content, for review/demo purposes."""
    return db.query(models.Message).filter(
        models.Message.campaign_id == campaign_id
    ).limit(limit).all()
