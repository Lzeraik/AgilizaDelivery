from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.order_service import OrderService
from app.models.order import OrderStatus
from app.utils.security import require_kitchen
from app.websockets.manager import manager

router = APIRouter(prefix="/kitchen", tags=["Cozinha"])


@router.get("/queue")
def get_kitchen_queue(db: Session = Depends(get_db), _=Depends(require_kitchen)):
    service = OrderService(db)
    orders = service.get_kitchen_queue()
    return [service.serialize_order(o) for o in orders]


@router.patch("/{order_id}/prepare")
async def start_preparing(order_id: int, db: Session = Depends(get_db), _=Depends(require_kitchen)):
    service = OrderService(db)
    order = service.update_status(order_id, OrderStatus.preparing)
    data = service.serialize_order(order)
    await manager.broadcast("display", "order_status_update", data)
    await manager.broadcast(f"order_{order.tracking_token}", "order_status_update", data)
    return data


@router.patch("/{order_id}/ready")
async def mark_ready(order_id: int, db: Session = Depends(get_db), _=Depends(require_kitchen)):
    service = OrderService(db)
    order = service.update_status(order_id, OrderStatus.ready)
    data = service.serialize_order(order)
    await manager.broadcast("display", "order_ready", data)
    await manager.broadcast("display", "order_status_update", data)
    await manager.broadcast(f"order_{order.tracking_token}", "order_status_update", data)
    return data


@router.websocket("/ws")
async def kitchen_websocket(websocket: WebSocket):
    await manager.connect(websocket, "kitchen")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "kitchen")
