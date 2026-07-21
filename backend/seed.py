"""
Seed the database with a default admin user and sample audience data so the
platform is immediately demo-able. Run with: python seed.py
"""
import asyncio
import random
from datetime import datetime, timedelta

from dotenv import load_dotenv
load_dotenv()  # picks up GROQ_API_KEY before ai_service reads it

from app.database import Base, engine, SessionLocal
from app import models, auth, ai_service

Base.metadata.create_all(bind=engine)
db = SessionLocal()

SAMPLE_CAMPAIGNS = [
    dict(
        name="Monsoon Health Awareness Drive",
        description="Remind citizens to boil drinking water and avoid stagnant water to prevent waterborne diseases during monsoon season",
        type=models.CampaignTypeEnum.awareness,
        tone="informative",
        channels=["email", "sms"],
    ),
    dict(
        name="Flash Flood Emergency Alert",
        description="Warn residents in flood-prone areas to move valuables to higher ground and avoid crossing flooded roads immediately",
        type=models.CampaignTypeEnum.emergency,
        tone="urgent",
        channels=["sms", "push", "whatsapp"],
    ),
    dict(
        name="Digital Literacy Workshop Enrollment",
        description="Invite citizens to enroll in free digital literacy workshops covering online banking, government portals, and cyber safety",
        type=models.CampaignTypeEnum.education,
        tone="friendly",
        channels=["email", "web"],
    ),
    dict(
        name="New Crop Insurance Scheme Announcement",
        description="Announce the launch of a new crop insurance scheme for farmers with details on registration and coverage before the deadline",
        type=models.CampaignTypeEnum.announcement,
        tone="formal",
        channels=["sms", "email"],
    ),
    dict(
        name="Vaccination Booster Drive",
        description="Encourage eligible citizens to get their vaccination booster dose at nearby government health centers this month",
        type=models.CampaignTypeEnum.awareness,
        tone="friendly",
        channels=["email", "sms", "whatsapp"],
    ),
    dict(
        name="Heatwave Safety Advisory",
        description="Advise citizens to stay hydrated, avoid outdoor activity during peak afternoon heat, and recognize signs of heatstroke",
        type=models.CampaignTypeEnum.emergency,
        tone="urgent",
        channels=["push", "sms", "web"],
    ),
]

SAMPLE_FEEDBACK_COMMENTS = [
    "This was very helpful, thank you for the update!",
    "Good to know, but I wish this came earlier.",
    "Not clear what I'm supposed to do next.",
    "Thanks for keeping us informed regularly.",
    "This alert was confusing and arrived too late.",
    "Appreciate the reminder, very useful information.",
]


async def seed_campaigns():
    manager = db.query(models.User).filter(models.User.username == "manager").first()
    recipients = db.query(models.Recipient).all()

    for camp_def in SAMPLE_CAMPAIGNS:
        existing = db.query(models.Campaign).filter(models.Campaign.name == camp_def["name"]).first()
        if existing:
            continue

        campaign = models.Campaign(
            name=camp_def["name"],
            description=camp_def["description"],
            type=camp_def["type"],
            created_by=manager.id if manager else None,
            segment_filter="{}",
            channels=",".join(camp_def["channels"]),
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)

        english = await ai_service.generate_content(camp_def["description"], camp_def["tone"], camp_def["type"].value)
        compliance = ai_service.check_compliance(english)
        sentiment = await ai_service.analyze_sentiment(english)
        content_row = models.CampaignContent(
            campaign_id=campaign.id, language="English", tone=camp_def["tone"],
            content=english, generated_by_ai=True,
            sentiment_score=sentiment["score"], sentiment_label=sentiment["label"],
            compliance_ok=compliance["compliance_ok"],
            compliance_notes=compliance["compliance_notes"],
        )
        db.add(content_row)

        target_langs = random.sample(list(ai_service.INDIAN_LANGUAGE_SAMPLES.keys()), 2)
        translations = await ai_service.translate_content(english, camp_def["tone"], target_langs)
        content_by_lang = {"English": english}
        for lang, text in translations.items():
            c = ai_service.check_compliance(text)
            s = await ai_service.analyze_sentiment(text)
            db.add(models.CampaignContent(
                campaign_id=campaign.id, language=lang, tone=camp_def["tone"],
                content=text, generated_by_ai=True,
                sentiment_score=s["score"], sentiment_label=s["label"],
                compliance_ok=c["compliance_ok"], compliance_notes=c["compliance_notes"],
            ))
            content_by_lang[lang] = text
        db.commit()

        send_to = random.sample(recipients, k=min(len(recipients), random.randint(5, len(recipients))))
        created_messages = []
        for recipient in send_to:
            lang_content = content_by_lang.get(recipient.language, english)
            personalized = await ai_service.personalize_content(
                lang_content, recipient.name, recipient.occupation, recipient.organization,
                recipient.language, recipient.state, recipient.city, recipient.engagement_score,
            )
            for channel in camp_def["channels"]:
                status = random.choices(
                    [models.MessageStatusEnum.delivered, models.MessageStatusEnum.opened,
                     models.MessageStatusEnum.clicked, models.MessageStatusEnum.sent,
                     models.MessageStatusEnum.failed],
                    weights=[0.35, 0.25, 0.15, 0.15, 0.10],
                )[0]
                sent_time = datetime.utcnow() - timedelta(days=random.randint(0, 6), hours=random.randint(0, 23))
                msg = models.Message(
                    campaign_id=campaign.id, recipient_id=recipient.id,
                    channel=models.ChannelEnum(channel), language=recipient.language,
                    content=personalized, status=status, sent_at=sent_time,
                    opened_at=sent_time + timedelta(minutes=20) if status.value in ("opened", "clicked") else None,
                    clicked_at=sent_time + timedelta(minutes=40) if status.value == "clicked" else None,
                )
                db.add(msg)
                created_messages.append(msg)
        campaign.status = models.CampaignStatusEnum.completed
        db.commit()
        for m in created_messages:
            db.refresh(m)

        clicked_or_opened = [m for m in created_messages if m.status.value in ("opened", "clicked")]
        feedback_sample = random.sample(clicked_or_opened, k=min(3, len(clicked_or_opened)))
        for msg in feedback_sample:
            comment = random.choice(SAMPLE_FEEDBACK_COMMENTS)
            sentiment = await ai_service.analyze_sentiment(comment)
            db.add(models.EngagementEvent(
                message_id=msg.id, event_type="feedback",
                sentiment=sentiment["label"], comment=comment,
            ))
        db.commit()

        print(f"Seeded campaign '{campaign.name}' — {len(created_messages)} messages across {len(camp_def['channels'])} channels")


SAMPLE_RECIPIENTS = [
    dict(name="Aarav Sharma", email="aarav@example.gov.in", phone="+919810000001",
         language="Hindi", state="Uttar Pradesh", city="Lucknow", occupation="Teacher",
         organization="Dept. of Education", org_hierarchy="District Office"),
    dict(name="Priya Iyer", email="priya@example.gov.in", phone="+919810000002",
         language="Tamil", state="Tamil Nadu", city="Chennai", occupation="Nurse",
         organization="Dept. of Health", org_hierarchy="City Hospital"),
    dict(name="Rohit Das", email="rohit@example.gov.in", phone="+919810000003",
         language="Bengali", state="West Bengal", city="Kolkata", occupation="Farmer",
         organization="Dept. of Agriculture", org_hierarchy="Block Office"),
    dict(name="Sunita Reddy", email="sunita@example.gov.in", phone="+919810000004",
         language="Telugu", state="Telangana", city="Hyderabad", occupation="Engineer",
         organization="Dept. of Urban Development", org_hierarchy="Municipal Corp"),
    dict(name="Vikram Patel", email="vikram@example.gov.in", phone="+919810000005",
         language="Gujarati", state="Gujarat", city="Ahmedabad", occupation="Shopkeeper",
         organization="Dept. of Commerce", org_hierarchy="Zonal Office"),
    dict(name="Ananya Nair", email="ananya@example.gov.in", phone="+919810000006",
         language="Malayalam", state="Kerala", city="Kochi", occupation="Student",
         organization="Dept. of Higher Education", org_hierarchy="University"),
    dict(name="Karan Singh", email="karan@example.gov.in", phone="+919810000007",
         language="Punjabi", state="Punjab", city="Amritsar", occupation="Police Officer",
         organization="Dept. of Public Safety", org_hierarchy="District HQ"),
    dict(name="Meera Joshi", email="meera@example.gov.in", phone="+919810000008",
         language="Marathi", state="Maharashtra", city="Pune", occupation="Doctor",
         organization="Dept. of Health", org_hierarchy="Civil Hospital"),
    dict(name="Arjun Gowda", email="arjun@example.gov.in", phone="+919810000009",
         language="Kannada", state="Karnataka", city="Bengaluru", occupation="IT Professional",
         organization="Dept. of Electronics & IT", org_hierarchy="State HQ"),
    dict(name="Ritu Verma", email="ritu@example.gov.in", phone="+919810000010",
         language="English", state="Delhi", city="New Delhi", occupation="Administrator",
         organization="Cabinet Secretariat", org_hierarchy="Central Office"),
]


def run():
    if not db.query(models.User).filter(models.User.username == "admin").first():
        admin = models.User(
            username="admin",
            email="admin@platform.gov.in",
            hashed_password=auth.hash_password("admin123"),
            role=models.RoleEnum.admin,
            organization="Platform Administration",
        )
        db.add(admin)
        print("Created admin user -> username: admin / password: admin123")

    if not db.query(models.User).filter(models.User.username == "manager").first():
        manager = models.User(
            username="manager",
            email="manager@platform.gov.in",
            hashed_password=auth.hash_password("manager123"),
            role=models.RoleEnum.campaign_manager,
            organization="Dept. of Public Communication",
        )
        db.add(manager)
        print("Created campaign manager -> username: manager / password: manager123")

    if db.query(models.Recipient).count() == 0:
        for r in SAMPLE_RECIPIENTS:
            db.add(models.Recipient(**r))
        print(f"Seeded {len(SAMPLE_RECIPIENTS)} sample recipients")

    if db.query(models.Template).count() == 0:
        db.add(models.Template(
            name="Public Health Awareness",
            category=models.CampaignTypeEnum.awareness,
            content="Stay informed about seasonal health precautions and vaccination drives in your area.",
            language="English",
        ))
        db.add(models.Template(
            name="Emergency Weather Alert",
            category=models.CampaignTypeEnum.emergency,
            content="A severe weather warning has been issued for your region. Please take necessary precautions.",
            language="English",
        ))
        db.add(models.Template(
            name="Workshop / Training Invitation",
            category=models.CampaignTypeEnum.education,
            content="You are invited to a free training session. Registration details and schedule are provided below.",
            language="English",
        ))
        db.add(models.Template(
            name="Policy / Scheme Announcement",
            category=models.CampaignTypeEnum.announcement,
            content="A new government scheme has been launched. Please review the eligibility criteria and application process.",
            language="English",
        ))
        print("Seeded 4 sample templates")

    db.commit()


if __name__ == "__main__":
    run()
    asyncio.run(seed_campaigns())
    print("Seeding complete.")
