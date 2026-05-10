from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StockUpdate(BaseModel):
    quantity: int
    min_quantity: Optional[int] = None


class StockResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    min_quantity: int
    is_low: bool = False
    updated_at: datetime

    model_config = {"from_attributes": True}
