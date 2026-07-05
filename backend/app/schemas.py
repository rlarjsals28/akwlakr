from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class GoalType(str, Enum):
    weight_loss = "weight_loss"
    maintenance = "maintenance"
    weight_gain = "weight_gain"


class UserSetup(BaseModel):
    nickname: Optional[str] = None
    gender: str
    age: int
    height_cm: float
    weight_kg: float
    goal: GoalType
    skeletal_muscle_mass: Optional[float] = None
    body_fat_mass: Optional[float] = None
    body_fat_percentage: Optional[float] = None


class UserResponse(UserSetup):
    id: int
    device_id: str
    bmr: Optional[float]
    daily_calories: Optional[float]
    carbs_g: Optional[float]
    protein_g: Optional[float]
    fat_g: Optional[float]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MealCreate(BaseModel):
    meal_time: str
    meal_date: str
    image_url: Optional[str] = None
    predicted_food: Optional[str] = None
    confidence: Optional[float] = None
    calories: float
    carbs: float
    protein: float
    fat: float


class MealResponse(MealCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MealSummary(BaseModel):
    meal_date: str
    total_calories: float
    total_carbs: float
    total_protein: float
    total_fat: float
    meals: List[MealResponse]


class NutritionProgress(BaseModel):
    label: str
    current: float
    target: float
    unit: str
    percentage: float


class Recommendation(BaseModel):
    message: str
    suggestions: List[str]
    next_meal_ideas: List[str]


class DashboardResponse(BaseModel):
    user: UserResponse
    summary: MealSummary
    progress: List[NutritionProgress]
    recommendation: Recommendation


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkoutChatResponse(BaseModel):
    message: ChatMessageResponse
    history: List[ChatMessageResponse]
    provider: str


class WorkoutChatHistoryResponse(BaseModel):
    history: List[ChatMessageResponse]
    provider: str
