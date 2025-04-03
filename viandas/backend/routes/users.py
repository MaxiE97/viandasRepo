# routes/users.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.models import User
from schemas.schemas import UserCreate, User as UserSchema, UserBase
from api.deps import get_db, get_current_user
from core.security import get_password_hash
from pydantic import BaseModel, EmailStr, Field


router = APIRouter()

@router.post("/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, name=user.name, apellido = user.apellido, celular = user.celular, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user



@router.put("/update-user-email", response_model=UserSchema)
def update_user_data(email: EmailStr, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    email_exists = db.query(User).filter(User.email == email, User.id != current_user.id).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="Email already in use")
    
    db_user.email = email
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/update-user-cellphone", response_model=UserSchema)
def update_user_cellphone(celular: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.celular = celular
    db.commit()
    db.refresh(db_user)
    return db_user
