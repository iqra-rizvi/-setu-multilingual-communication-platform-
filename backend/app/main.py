from dotenv import load_dotenv
load_dotenv()  # must run before ai_service (or anything else) reads os.getenv() at import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth_router, audience_router, ai_router, distribution_router, analytics_router, template_router
from .routers import chatbot_router
from app.routers import poster_router
from .routers import bulletins



Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Based Multilingual Mass Communication & Public Awareness Management Platform",
    description=(
        "End-to-end platform for organizations to create, translate, personalize, "
        "distribute, and monitor multilingual communication campaigns across "
        "email, SMS, WhatsApp, push, and web channels."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(audience_router.router)
app.include_router(ai_router.router)
app.include_router(distribution_router.router)
app.include_router(analytics_router.router)
app.include_router(template_router.router)
app.include_router(chatbot_router.router)
app.include_router(poster_router.router)
app.include_router(bulletins.router)


@app.get("/")
def root():
    return {
        "status": "ok",
        "platform": "AI-Based Multilingual Mass Communication & Public Awareness Management Platform",
        "modules": [
            "Audience Management & Campaign Planning",
            "AI Content Generation & Multilingual Communication Engine",
            "Multi-Channel Distribution & Engagement Analytics Platform",
        ],
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
