from datetime import datetime
from sqlalchemy.orm import Session
from . import models, schemas


def get_user_by_device_id(db: Session, device_id: str):
    return db.query(models.User).filter(models.User.device_id == device_id).first()


def create_or_update_user(db: Session, device_id: str, profile: schemas.UserSetup):
    profile_data = calculate_nutrition_profile(
        gender=profile.gender,
        age=profile.age,
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        goal=profile.goal,
        skeletal_muscle_mass=profile.skeletal_muscle_mass,
        body_fat_percentage=profile.body_fat_percentage,
    )

    db_user = get_user_by_device_id(db, device_id)
    if db_user:
        db_user.nickname = profile.nickname
        db_user.gender = profile.gender
        db_user.age = profile.age
        db_user.height_cm = profile.height_cm
        db_user.weight_kg = profile.weight_kg
        db_user.goal = profile.goal
        db_user.skeletal_muscle_mass = profile.skeletal_muscle_mass
        db_user.body_fat_mass = profile.body_fat_mass
        db_user.body_fat_percentage = profile.body_fat_percentage
        db_user.bmr = profile_data["bmr"]
        db_user.daily_calories = profile_data["daily_calories"]
        db_user.carbs_g = profile_data["carbs_g"]
        db_user.protein_g = profile_data["protein_g"]
        db_user.fat_g = profile_data["fat_g"]
    else:
        db_user = models.User(
            device_id=device_id,
            nickname=profile.nickname,
            gender=profile.gender,
            age=profile.age,
            height_cm=profile.height_cm,
            weight_kg=profile.weight_kg,
            goal=profile.goal,
            skeletal_muscle_mass=profile.skeletal_muscle_mass,
            body_fat_mass=profile.body_fat_mass,
            body_fat_percentage=profile.body_fat_percentage,
            bmr=profile_data["bmr"],
            daily_calories=profile_data["daily_calories"],
            carbs_g=profile_data["carbs_g"],
            protein_g=profile_data["protein_g"],
            fat_g=profile_data["fat_g"],
        )
        db.add(db_user)

    db.commit()
    db.refresh(db_user)
    return db_user


def create_meal_record(db: Session, user_id: int, meal: schemas.MealCreate):
    db_meal = models.MealRecord(
        user_id=user_id,
        meal_time=meal.meal_time,
        meal_date=meal.meal_date,
        image_url=meal.image_url,
        predicted_food=meal.predicted_food,
        confidence=meal.confidence,
        calories=meal.calories,
        carbs=meal.carbs,
        protein=meal.protein,
        fat=meal.fat,
    )
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal


def get_meals_by_user(db: Session, user_id: int, meal_date: str = None):
    query = db.query(models.MealRecord).filter(models.MealRecord.user_id == user_id)
    if meal_date:
        query = query.filter(models.MealRecord.meal_date == meal_date)
    return query.order_by(models.MealRecord.created_at.desc()).all()


def get_daily_summary(db: Session, user_id: int, meal_date: str):
    meals = get_meals_by_user(db, user_id, meal_date)
    return {
        "meal_date": meal_date,
        "total_calories": round(sum(meal.calories for meal in meals), 1),
        "total_carbs": round(sum(meal.carbs for meal in meals), 1),
        "total_protein": round(sum(meal.protein for meal in meals), 1),
        "total_fat": round(sum(meal.fat for meal in meals), 1),
        "meals": meals,
    }


def calculate_nutrition_profile(
    gender: str,
    age: int,
    height_cm: float,
    weight_kg: float,
    goal: schemas.GoalType,
    skeletal_muscle_mass: float | None = None,
    body_fat_percentage: float | None = None,
):
    if gender.lower() in ["male", "m", "남성"]:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    activity_factor = 1.375
    if skeletal_muscle_mass and skeletal_muscle_mass > weight_kg * 0.4:
        activity_factor = 1.55

    maintenance_calories = bmr * activity_factor

    if goal == schemas.GoalType.weight_loss:
        daily_calories = maintenance_calories - 500
    elif goal == schemas.GoalType.weight_gain:
        daily_calories = maintenance_calories + 400
    else:
        daily_calories = maintenance_calories

    if body_fat_percentage and body_fat_percentage > 25:
        daily_calories -= 100

    protein_g = weight_kg * (2.0 if goal == schemas.GoalType.weight_gain else 1.8)
    if skeletal_muscle_mass:
        protein_g = max(protein_g, skeletal_muscle_mass * 2.2)

    fat_g = weight_kg * 0.9
    carbs_calories = daily_calories - protein_g * 4 - fat_g * 9
    carbs_g = max(carbs_calories / 4, 0)

    return {
        "bmr": round(bmr, 1),
        "daily_calories": round(max(daily_calories, 1200), 1),
        "carbs_g": round(carbs_g, 1),
        "protein_g": round(protein_g, 1),
        "fat_g": round(fat_g, 1),
    }


def build_progress(user: models.User, summary: dict) -> list[dict]:
    targets = [
        ("칼로리", summary["total_calories"], user.daily_calories or 0, "kcal"),
        ("단백질", summary["total_protein"], user.protein_g or 0, "g"),
        ("탄수화물", summary["total_carbs"], user.carbs_g or 0, "g"),
        ("지방", summary["total_fat"], user.fat_g or 0, "g"),
    ]
    progress = []
    for label, current, target, unit in targets:
        percentage = round((current / target) * 100, 1) if target > 0 else 0
        progress.append(
            {
                "label": label,
                "current": round(current, 1),
                "target": round(target, 1),
                "unit": unit,
                "percentage": min(percentage, 150),
            }
        )
    return progress


def build_recommendation(user: models.User, meals: list[models.MealRecord], meal_date: str):
    today_meals = [meal for meal in meals if meal.meal_date == meal_date]
    total_calories = sum(meal.calories for meal in today_meals)
    total_protein = sum(meal.protein for meal in today_meals)
    total_carbs = sum(meal.carbs for meal in today_meals)
    total_fat = sum(meal.fat for meal in today_meals)

    suggestions = []
    next_meal_ideas = []
    message = "오늘의 식단을 분석했습니다."

    protein_ratio = (total_protein / user.protein_g) if user.protein_g else 1
    carbs_ratio = (total_carbs / user.carbs_g) if user.carbs_g else 1
    fat_ratio = (total_fat / user.fat_g) if user.fat_g else 1
    calorie_ratio = (total_calories / user.daily_calories) if user.daily_calories else 1

    if user.protein_g and protein_ratio < 0.7:
        suggestions.append("단백질 섭취가 부족합니다. 닭가슴살, 계란, 두부를 늘려보세요.")
        next_meal_ideas.extend(["닭가슴살 샐러드", "계란 2개 + 두부", "그릭 요거트"])
    elif user.protein_g and protein_ratio > 1.2:
        suggestions.append("단백질이 충분합니다. 탄수화물과 지방 균형을 맞춰보세요.")

    if user.carbs_g and carbs_ratio > 1.1:
        suggestions.append("탄수화물 섭취가 다소 높습니다. 저탄수화물 채소 위주 식단을 추천합니다.")
        next_meal_ideas.extend(["브로콜리 볶음", "새우 아보카도 샐러드", "채소 스테이크"])
    elif user.carbs_g and carbs_ratio < 0.6:
        suggestions.append("탄수화물이 부족합니다. 현미밥, 고구마 등 건강한 탄수를 추가하세요.")
        next_meal_ideas.extend(["현미밥 1공기", "고구마", "오트밀"])

    if user.fat_g and fat_ratio > 1.15:
        suggestions.append("지방 섭취가 높습니다. 구운 식품과 저지방 단백질을 선택하세요.")
        next_meal_ideas.extend(["찜 닭가슴살", "샐러드 + 올리브오일 소량"])

    if user.daily_calories and calorie_ratio > 1.1:
        suggestions.append("오늘 칼로리가 목표를 초과했습니다. 가벼운 식사를 권장합니다.")
        next_meal_ideas.extend(["미역국", "두부 샐러드", "방울토마토 간식"])
    elif user.daily_calories and calorie_ratio < 0.5:
        suggestions.append("칼로리 섭취가 부족합니다. 균형 잡힌 식사를 추가하세요.")

    if user.body_fat_percentage and user.body_fat_percentage > 25:
        suggestions.append("체지방 관리를 위해 식이섬유가 풍부한 채소를 함께 드세요.")

    recorded_times = {meal.meal_time for meal in today_meals}
    if "저녁" not in recorded_times and "간식" not in recorded_times:
        if not next_meal_ideas:
            next_meal_ideas.append("닭가슴살 + 채소 볶음")

    if not suggestions:
        message = "좋습니다. 영양소 섭취가 균형 잡혀 있습니다."

    unique_ideas = []
    for idea in next_meal_ideas:
        if idea not in unique_ideas:
            unique_ideas.append(idea)

    return {
        "message": message,
        "suggestions": suggestions or ["오늘 식사 패턴을 계속 유지하세요."],
        "next_meal_ideas": unique_ideas[:5] or ["균형 잡힌 한 끼 식사를 기록해보세요."],
    }


def get_workout_chat_history(db: Session, user_id: int):
    return (
        db.query(models.WorkoutChatMessage)
        .filter(models.WorkoutChatMessage.user_id == user_id)
        .order_by(models.WorkoutChatMessage.created_at.asc())
        .all()
    )


def create_workout_chat_message(db: Session, user_id: int, role: str, content: str):
    message = models.WorkoutChatMessage(user_id=user_id, role=role, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def clear_workout_chat_history(db: Session, user_id: int):
    db.query(models.WorkoutChatMessage).filter(
        models.WorkoutChatMessage.user_id == user_id
    ).delete()
    db.commit()
