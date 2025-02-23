# routes/admin.py
from fastapi import APIRouter, HTTPException, Depends
from models.models import User
from api.deps import get_current_user

router = APIRouter()

@router.get("/test/")
def get_admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return "Excelente, eres administrador"
