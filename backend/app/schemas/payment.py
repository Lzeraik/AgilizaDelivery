from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from decimal import Decimal
from app.models.payment import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    order_id: int
    method: PaymentMethod


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    method: PaymentMethod
    amount: Decimal
    status: PaymentStatus
    transaction_id: Optional[str]
    tef_response: Optional[Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class TEFInitResponse(BaseModel):
    transaction_id: str
    status: str
    message: str
    qr_code_pix: Optional[str] = None
