from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import auth, crud, schemas
from ..database import get_db
from ..services.llm_service import generate_workout_reply, get_welcome_message

router = APIRouter()


def _get_provider() -> str:
    import os

    return "openai" if os.getenv("OPENAI_API_KEY", "").strip() else "local"


@router.get("/history", response_model=schemas.WorkoutChatHistoryResponse)
def get_chat_history(
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    history = crud.get_workout_chat_history(db=db, user_id=current_user.id)
    if not history:
        welcome = crud.create_workout_chat_message(
            db=db,
            user_id=current_user.id,
            role="assistant",
            content=get_welcome_message(current_user),
        )
        history = [welcome]

    return {"history": history, "provider": _get_provider()}


@router.post("/chat", response_model=schemas.WorkoutChatResponse)
def send_chat_message(
    payload: schemas.ChatMessageCreate,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    content = payload.content.strip()
    if not content:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="메시지를 입력해주세요.")

    history = crud.get_workout_chat_history(db=db, user_id=current_user.id)
    crud.create_workout_chat_message(
        db=db, user_id=current_user.id, role="user", content=content
    )

    reply_text, provider = generate_workout_reply(
        user=current_user,
        history=history,
        user_message=content,
    )
    assistant_message = crud.create_workout_chat_message(
        db=db, user_id=current_user.id, role="assistant", content=reply_text
    )
    updated_history = crud.get_workout_chat_history(db=db, user_id=current_user.id)

    return {
        "message": assistant_message,
        "history": updated_history,
        "provider": provider,
    }


@router.delete("/history", response_model=schemas.WorkoutChatHistoryResponse)
def clear_chat_history(
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    crud.clear_workout_chat_history(db=db, user_id=current_user.id)
    welcome = crud.create_workout_chat_message(
        db=db,
        user_id=current_user.id,
        role="assistant",
        content=get_welcome_message(current_user),
    )
    return {"history": [welcome], "provider": _get_provider()}
