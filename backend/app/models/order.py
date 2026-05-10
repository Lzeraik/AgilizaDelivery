from sqlalchemy import Column, Integer, String, Boolean, Text, Numeric, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class OrderStatus(str, enum.Enum):
    pending = "pending"
    preparing = "preparing"
    ready = "ready"
    delivered = "delivered"
    cancelled = "cancelled"


class OrderSource(str, enum.Enum):
    totem = "totem"
    attendant = "attendant"


class OrderType(str, enum.Enum):
    dine_in = "dine_in"
    takeaway = "takeaway"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(10), nullable=False, index=True)
    source = Column(SAEnum(OrderSource), nullable=False, default=OrderSource.totem)
    attendant_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(100), nullable=True)
    status = Column(SAEnum(OrderStatus), nullable=False, default=OrderStatus.pending)
    order_type = Column(SAEnum(OrderType), nullable=False, default=OrderType.dine_in)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0)
    tracking_token = Column(String(36), unique=True, nullable=False, index=True)
    qr_code_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    nfe_chave = Column(String(100), nullable=True)
    nfe_status = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    attendant = relationship("User", back_populates="orders", foreign_keys=[attendant_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    notes = Column(Text, nullable=True)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
