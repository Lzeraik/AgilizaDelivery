from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.order_service import OrderService
from app.websockets.manager import manager

router = APIRouter(prefix="/display", tags=["Display"])


@router.get("/orders")
def get_display_orders(db: Session = Depends(get_db)):
    service = OrderService(db)
    result = service.get_display_orders()
    return {
        "preparing": [service.serialize_order(o) for o in result["preparing"]],
        "ready": [service.serialize_order(o) for o in result["ready"]],
    }


@router.websocket("/ws")
async def display_websocket(websocket: WebSocket):
    await manager.connect(websocket, "display")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "display")


@router.websocket("/ws/order/{token}")
async def order_tracking_websocket(websocket: WebSocket, token: str):
    channel = f"order_{token}"
    await manager.connect(websocket, channel)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
