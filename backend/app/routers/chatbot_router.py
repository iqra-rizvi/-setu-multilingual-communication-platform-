from fastapi import APIRouter
from app.schemas import ChatRequest, ChatResponse
from app.ai_service import chatbot_response


router = APIRouter(prefix="/chat", tags=["Chatbot"])

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):

    answer = await chatbot_response(request.question)

    return ChatResponse(answer=answer)