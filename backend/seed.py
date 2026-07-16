"""
Seed the database with a default admin user and sample audience data so the
platform is immediately demo-able. Run with: python seed.py
"""
from app.database import Base, engine, SessionLocal
from app import models, auth

Base.metadata.create_all(bind=engine)
db = SessionLocal()

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
        print("Seeded 2 sample templates")

    db.commit()


if __name__ == "__main__":
    run()
    print("Seeding complete.")
