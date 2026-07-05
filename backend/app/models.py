from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base
import enum
from datetime import datetime


class GoalType(str, enum.Enum):
    weight_loss = "weight_loss"
    maintenance = "maintenance"
    weight_gain = "weight_gain"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    nickname = Column(String, nullable=True)
    gender = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    goal = Column(Enum(GoalType), nullable=False)
    skeletal_muscle_mass = Column(Float, nullable=True)
    body_fat_mass = Column(Float, nullable=True)
    body_fat_percentage = Column(Float, nullable=True)
    bmr = Column(Float, nullable=True)
    daily_calories = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    meals = relationship("MealRecord", back_populates="owner", cascade="all, delete-orphan")
    workout_messages = relationship(
        "WorkoutChatMessage", back_populates="owner", cascade="all, delete-orphan"
    )


class MealRecord(Base):
    __tablename__ = "meal_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meal_time = Column(String, nullable=False)
    meal_date = Column(String, nullable=False)
    image_url = Column(Text, nullable=True)
    predicted_food = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    calories = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="meals")


class WorkoutChatMessage(Base):
    __tablename__ = "workout_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="workout_messages")
