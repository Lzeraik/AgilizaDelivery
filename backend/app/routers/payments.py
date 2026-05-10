from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.payment import PaymentCreate, PaymentResponse, TEFInitResponse
from app.services.payment_service import PaymentService
from app.services.stock_service import StockService
from app.models.order import Order
from app.websockets.manager import manager
from app.services.order_service import OrderService

router = APIRouter(prefix="/payments", tags=["Pagamentos"])


@router.post("/initiate", response_model=TEFInitResponse)
def initiate_payment(data: PaymentCreate, db: Session = Depends(get_db)):
    result = PaymentService(db).initiate_payment(data)
    return TEFInitResponse(**result)


@router.post("/{order_id}/confirm", response_model=PaymentResponse)
async def confirm_payment(order_id: int, db: Session = Depends(get_db)):
    service = PaymentService(db)
    payment = service.confirm_payment(order_id)
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        StockService(db).decrement_for_order(order)
        order_data = OrderService(db).serialize_order(order)
        await manager.broadcast("kitchen", "new_order", order_data)
        await manager.broadcast("display", "new_order", order_data)
    return payment


@router.post("/{order_id}/fail", response_model=PaymentResponse)
def fail_payment(order_id: int, db: Session = Depends(get_db)):
    return PaymentService(db).fail_payment(order_id)
