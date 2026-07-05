import uuid
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, auth
from ..database import get_db
from ..ml.food_classifier import analyze_image

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload", response_model=schemas.MealResponse)
def upload_meal(
    meal_time: str = Form(...),
    meal_date: str = Form(...),
    image: UploadFile = File(...),
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not image.content_type or image.content_type.split("/")[0] != "image":
        raise HTTPException(status_code=400, detail="이미지 파일을 업로드해주세요.")

    file_name = f"{uuid.uuid4().hex}_{image.filename}"
    file_path = UPLOAD_DIR / file_name
    file_data = image.file.read()
    file_path.write_bytes(file_data)

    analysis = analyze_image(str(file_path))
    meal = schemas.MealCreate(
        meal_time=meal_time,
        meal_date=meal_date,
        image_url=file_name,
        predicted_food=analysis["predicted_food"],
        confidence=analysis["confidence"],
        calories=analysis["calories"],
        carbs=analysis["carbs"],
        protein=analysis["protein"],
        fat=analysis["fat"],
    )
    return crud.create_meal_record(db=db, user_id=current_user.id, meal=meal)


@router.get("/", response_model=List[schemas.MealResponse])
def list_meals(
    meal_date: str | None = None,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_meals_by_user(db=db, user_id=current_user.id, meal_date=meal_date)


@router.get("/summary", response_model=schemas.MealSummary)
def daily_summary(
    meal_date: str | None = None,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    summary_date = meal_date or datetime.utcnow().date().isoformat()
    return crud.get_daily_summary(db=db, user_id=current_user.id, meal_date=summary_date)
