from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .database import engine, Base
from .routers import users as users_router
from .routers import meals as meals_router
from .routers import recommendations as recommendations_router
from .routers import workouts as workouts_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Nutrition Coach",
    description="맞춤형 식단 관리와 음식 이미지 분석을 제공하는 건강 관리 플랫폼",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.include_router(users_router.router, prefix="/api/users", tags=["users"])
app.include_router(meals_router.router, prefix="/api/meals", tags=["meals"])
app.include_router(recommendations_router.router, prefix="/api/recommendations", tags=["recommendations"])
app.include_router(workouts_router.router, prefix="/api/workouts", tags=["workouts"])


@app.get("/")
def root():
    return {"message": "AI Nutrition Coach API is running."}
