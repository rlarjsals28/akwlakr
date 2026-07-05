from datetime import datetime
from fastapi import APIRouter, Depends
from .. import crud, auth, schemas
from ..database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=schemas.Recommendation)
def get_recommendation(
    meal_date: str | None = None,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    summary_date = meal_date or datetime.utcnow().date().isoformat()
    meals = crud.get_meals_by_user(db=db, user_id=current_user.id)
    return crud.build_recommendation(current_user, meals, summary_date)


@router.get("/dashboard", response_model=schemas.DashboardResponse)
def get_dashboard(
    meal_date: str | None = None,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    summary_date = meal_date or datetime.utcnow().date().isoformat()
    summary = crud.get_daily_summary(db=db, user_id=current_user.id, meal_date=summary_date)
    meals = crud.get_meals_by_user(db=db, user_id=current_user.id)
    progress = crud.build_progress(current_user, summary)
    recommendation = crud.build_recommendation(current_user, meals, summary_date)

    return {
        "user": current_user,
        "summary": summary,
        "progress": progress,
        "recommendation": recommendation,
    }
