from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from . import crud
from .database import get_db


def get_device_id(x_device_id: str = Header(..., alias="X-Device-Id")) -> str:
    if not x_device_id or len(x_device_id.strip()) < 8:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효한 기기 ID가 필요합니다.",
        )
    return x_device_id.strip()


def get_current_user(device_id: str = Depends(get_device_id), db: Session = Depends(get_db)):
    user = crud.get_user_by_device_id(db, device_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로필이 없습니다. 신체 정보를 먼저 입력해주세요.",
        )
    return user
