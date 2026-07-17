from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/analytics", tags=["Distribution & Analytics"])


@router.get("/overview")
def overview(db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)):
    total_campaigns = db.query(func.count(models.Campaign.id)).scalar()
    total_recipients = db.query(func.count(models.Recipient.id)).scalar()
    total_messages = db.query(func.count(models.Message.id)).scalar()

    delivered = db.query(func.count(models.Message.id)).filter(
        models.Message.status.in_([
            models.MessageStatusEnum.delivered,
            models.MessageStatusEnum.opened,
            models.MessageStatusEnum.clicked,
        ])
    ).scalar()
    opened = db.query(func.count(models.Message.id)).filter(
        models.Message.status.in_([models.MessageStatusEnum.opened, models.MessageStatusEnum.clicked])
    ).scalar()
    clicked = db.query(func.count(models.Message.id)).filter(
        models.Message.status == models.MessageStatusEnum.clicked
    ).scalar()
    failed = db.query(func.count(models.Message.id)).filter(
        models.Message.status == models.MessageStatusEnum.failed
    ).scalar()

    # language-wise reach
    lang_rows = db.query(models.Message.language, func.count(models.Message.id)).group_by(
        models.Message.language
    ).all()
    language_breakdown = [{"language": lang, "count": count} for lang, count in lang_rows]

    # channel-wise reach
    channel_rows = db.query(models.Message.channel, func.count(models.Message.id)).group_by(
        models.Message.channel
    ).all()
    channel_breakdown = [{"channel": ch.value, "count": count} for ch, count in channel_rows]

    # campaign type breakdown
    type_rows = db.query(models.Campaign.type, func.count(models.Campaign.id)).group_by(
        models.Campaign.type
    ).all()
    campaign_type_breakdown = [{"type": t.value, "count": count} for t, count in type_rows]

    open_rate = round((opened / total_messages) * 100, 1) if total_messages else 0
    click_rate = round((clicked / total_messages) * 100, 1) if total_messages else 0
    delivery_rate = round((delivered / total_messages) * 100, 1) if total_messages else 0
    failure_rate = round((failed / total_messages) * 100, 1) if total_messages else 0

    return {
        "total_campaigns": total_campaigns,
        "total_recipients": total_recipients,
        "total_messages": total_messages,
        "delivery_rate": delivery_rate,
        "open_rate": open_rate,
        "click_rate": click_rate,
        "failure_rate": failure_rate,
        "language_breakdown": language_breakdown,
        "channel_breakdown": channel_breakdown,
        "campaign_type_breakdown": campaign_type_breakdown,
    }


@router.get("/campaign/{campaign_id}")
def campaign_analytics(
    campaign_id: str, db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)
):
    messages = db.query(models.Message).filter(models.Message.campaign_id == campaign_id).all()
    total = len(messages)
    status_counts = {}
    for m in messages:
        status_counts[m.status.value] = status_counts.get(m.status.value, 0) + 1

    message_ids = [m.id for m in messages]
    events = db.query(models.EngagementEvent).filter(
        models.EngagementEvent.message_id.in_(message_ids)
    ).all() if message_ids else []

    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    for e in events:
        if e.sentiment in sentiment_counts:
            sentiment_counts[e.sentiment] += 1

    lang_counts = {}
    for m in messages:
        lang_counts[m.language] = lang_counts.get(m.language, 0) + 1

    return {
        "campaign_id": campaign_id,
        "total_messages": total,
        "status_breakdown": status_counts,
        "language_breakdown": lang_counts,
        "sentiment_breakdown": sentiment_counts,
        "feedback_events": [
            {"event_type": e.event_type, "sentiment": e.sentiment, "comment": e.comment}
            for e in events if e.comment
        ],
    }


@router.get("/feedback")
def all_feedback(db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)):
    """Aggregates every feedback comment across all campaigns, with campaign and recipient context."""
    events = db.query(models.EngagementEvent).filter(
        models.EngagementEvent.comment != ""
    ).order_by(models.EngagementEvent.created_at.desc()).all()

    results = []
    for e in events:
        msg = db.query(models.Message).filter(models.Message.id == e.message_id).first()
        if not msg:
            continue
        campaign = db.query(models.Campaign).filter(models.Campaign.id == msg.campaign_id).first()
        recipient = db.query(models.Recipient).filter(models.Recipient.id == msg.recipient_id).first()
        results.append({
            "id": e.id,
            "campaign_id": msg.campaign_id,
            "campaign_name": campaign.name if campaign else "Unknown",
            "recipient_name": recipient.name if recipient else "Unknown",
            "language": msg.language,
            "event_type": e.event_type,
            "sentiment": e.sentiment,
            "comment": e.comment,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        })

    sentiment_totals = {"positive": 0, "neutral": 0, "negative": 0}
    for r in results:
        if r["sentiment"] in sentiment_totals:
            sentiment_totals[r["sentiment"]] += 1

    return {"total": len(results), "sentiment_totals": sentiment_totals, "feedback": results}


@router.get("/campaigns-summary")
def campaigns_summary(db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)):
    """Quick per-campaign metrics table for the Analytics page."""
    campaigns = db.query(models.Campaign).order_by(models.Campaign.created_at.desc()).all()
    summary = []
    for c in campaigns:
        messages = db.query(models.Message).filter(models.Message.campaign_id == c.id).all()
        total = len(messages)
        delivered = len([m for m in messages if m.status.value in ("delivered", "opened", "clicked")])
        opened = len([m for m in messages if m.status.value in ("opened", "clicked")])
        clicked = len([m for m in messages if m.status.value == "clicked"])
        summary.append({
            "id": c.id,
            "name": c.name,
            "type": c.type.value,
            "status": c.status.value,
            "total_messages": total,
            "delivery_rate": round((delivered / total) * 100, 1) if total else 0,
            "open_rate": round((opened / total) * 100, 1) if total else 0,
            "click_rate": round((clicked / total) * 100, 1) if total else 0,
        })
    return summary
