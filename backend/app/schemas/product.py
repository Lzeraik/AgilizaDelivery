from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class ProductBase(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    image_url: Optional[str] = None
    is_available: bool = True
    preparation_time: int = 15
    display_order: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    preparation_time: Optional[int] = None
    display_order: Optional[int] = None


class ProductResponse(ProductBase):
    id: int

    model_config = {"from_attributes": True}


class ProductWithStockResponse(ProductResponse):
    stock_quantity: Optional[int] = None

    model_config = {"from_attributes": True}
