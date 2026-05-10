from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.order import Order, OrderStatus
from app.schemas.order import OrderCreate, OrderResponse
from app.services.order_service import OrderService
from app.utils.security import get_current_user
from app.websockets.manager import manager

router = APIRouter(prefix="/orders", tags=["Pedidos"])


def _build_response(order: Order) -> dict:
    svc = OrderService.__new__(OrderService)
    svc.db = None
    return {
        "id": order.id,
        "order_number": order.order_number,
        "source": order.source,
        "customer_name": order.customer_name,
        "status": order.status,
        "order_type": order.order_type,
        "total_amount": float(order.total_amount),
        "tracking_token": order.tracking_token,
        "qr_code_url": order.qr_code_url,
        "notes": order.notes,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "items": [
            {
                "id": i.id,
                "product_id": i.product_id,
                "product_name": i.product.name if i.product else None,
                "product_image": i.product.image_url if i.product else None,
                "quantity": i.quantity,
                "unit_price": float(i.unit_price),
                "notes": i.notes,
            }
            for i in order.items
        ],
    }


@router.post("/", status_code=201)
async def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    service = OrderService(db)
    order = service.create_order(data)
    order_data = service.serialize_order(order)
    await manager.broadcast("kitchen", "new_order", order_data)
    await manager.broadcast("display", "new_order", order_data)
    return order_data


@router.get("/track/{token}")
def track_order(token: str, db: Session = Depends(get_db)):
    return _build_response(OrderService(db).get_order_by_token(token))


@router.get("/", response_model=List[dict])
def list_orders(
    status: Optional[OrderStatus] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Order)
    if status:
        q = q.filter(Order.status == status)
    orders = q.order_by(Order.created_at.desc()).limit(limit).all()
    return [_build_response(o) for o in orders]


@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return _build_response(order)


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Campo 'status' obrigatório")
    service = OrderService(db)
    order = service.update_status(order_id, OrderStatus(new_status))
    order_data = service.serialize_order(order)
    await manager.broadcast("display", "order_status_update", order_data)
    await manager.broadcast(f"order_{order.tracking_token}", "order_status_update", order_data)
    if order.status == OrderStatus.ready:
        await manager.broadcast("display", "order_ready", order_data)
    return order_data
