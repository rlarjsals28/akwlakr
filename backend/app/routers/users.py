from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter()


@router.post("/setup", response_model=schemas.UserResponse)
def setup_profile(
    profile: schemas.UserSetup,
    device_id: str = Depends(auth.get_device_id),
    db: Session = Depends(get_db),
):
    return crud.create_or_update_user(db=db, device_id=device_id, profile=profile)


@router.get("/profile", response_model=schemas.UserResponse)
def read_profile(current_user=Depends(auth.get_current_user)):
    return current_user


@router.get("/profile/status")
def profile_status(device_id: str = Depends(auth.get_device_id), db: Session = Depends(get_db)):
    user = crud.get_user_by_device_id(db, device_id)
    return {"has_profile": user is not None}
