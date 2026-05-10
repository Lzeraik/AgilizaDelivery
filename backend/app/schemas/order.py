from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.order import OrderStatus, OrderSource, OrderType


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = 1
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    quantity: int
    unit_price: Decimal
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    source: OrderSource = OrderSource.totem
    attendant_id: Optional[int] = None
    customer_name: Optional[str] = None
    order_type: OrderType = OrderType.dine_in
    items: List[OrderItemCreate]
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: int
    order_number: str
    source: OrderSource
    customer_name: Optional[str]
    status: OrderStatus
    order_type: OrderType
    total_amount: Decimal
    tracking_token: str
    qr_code_url: Optional[str]
    notes: Optional[str]
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
