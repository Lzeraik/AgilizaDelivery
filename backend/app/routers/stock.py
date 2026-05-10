from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.stock import StockUpdate, StockResponse
from app.services.stock_service import StockService
from app.utils.security import require_admin

router = APIRouter(prefix="/stock", tags=["Estoque"])


@router.get("/", response_model=List[dict])
def list_stock(db: Session = Depends(get_db), _=Depends(require_admin)):
    stocks = StockService(db).list_all()
    return [
        {
            "id": s.id,
            "product_id": s.product_id,
            "product_name": s.product.name if s.product else None,
            "quantity": s.quantity,
            "min_quantity": s.min_quantity,
            "is_low": s.quantity <= s.min_quantity,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in stocks
    ]


@router.get("/low", response_model=List[dict])
def get_low_stock(db: Session = Depends(get_db), _=Depends(require_admin)):
    stocks = StockService(db).get_low_stock()
    return [
        {
            "product_id": s.product_id,
            "product_name": s.product.name if s.product else None,
            "quantity": s.quantity,
            "min_quantity": s.min_quantity,
        }
        for s in stocks
    ]


@router.put("/{product_id}", response_model=dict)
def update_stock(product_id: int, data: StockUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    s = StockService(db).update_quantity(product_id, data.quantity, data.min_quantity)
    return {
        "product_id": s.product_id,
        "quantity": s.quantity,
        "min_quantity": s.min_quantity,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }
