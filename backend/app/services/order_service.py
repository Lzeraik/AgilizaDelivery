import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from fastapi import HTTPException
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.services.qrcode_service import QRCodeService


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.qr_service = QRCodeService()

    def _next_order_number(self) -> str:
        today = date.today()
        count = (
            self.db.query(func.count(Order.id))
            .filter(cast(Order.created_at, Date) == today)
            .scalar()
        )
        return str((count or 0) + 1).zfill(3)

    def create_order(self, data: OrderCreate) -> Order:
        if not data.items:
            raise HTTPException(status_code=400, detail="O pedido deve ter ao menos um item")

        total = Decimal("0")
        items_to_create = []

        for item_data in data.items:
            product = self.db.query(Product).filter(
                Product.id == item_data.product_id,
                Product.is_available == True,
            ).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Produto {item_data.product_id} não encontrado ou indisponível")
            subtotal = Decimal(str(product.price)) * item_data.quantity
            total += subtotal
            items_to_create.append((product, item_data))

        token = str(uuid.uuid4())
        order = Order(
            order_number=self._next_order_number(),
            source=data.source,
            attendant_id=data.attendant_id,
            customer_name=data.customer_name,
            order_type=data.order_type,
            total_amount=total,
            tracking_token=token,
            notes=data.notes,
            status=OrderStatus.pending,
        )
        self.db.add(order)
        self.db.flush()

        for product, item_data in items_to_create:
            item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item_data.quantity,
                unit_price=Decimal(str(product.price)),
                notes=item_data.notes,
            )
            self.db.add(item)

        order.qr_code_url = self.qr_service.generate_qr_file(token)
        self.db.commit()
        self.db.refresh(order)
        return order

    def get_order_by_token(self, token: str) -> Order:
        order = self.db.query(Order).filter(Order.tracking_token == token).first()
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        return order

    def update_status(self, order_id: int, new_status: OrderStatus) -> Order:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        order.status = new_status
        self.db.commit()
        self.db.refresh(order)
        return order

    def get_kitchen_queue(self):
        return (
            self.db.query(Order)
            .filter(Order.status.in_([OrderStatus.pending, OrderStatus.preparing]))
            .order_by(Order.created_at.asc())
            .all()
        )

    def get_display_orders(self):
        preparing = (
            self.db.query(Order)
            .filter(Order.status == OrderStatus.preparing)
            .order_by(Order.created_at.asc())
            .all()
        )
        ready = (
            self.db.query(Order)
            .filter(Order.status == OrderStatus.ready)
            .order_by(Order.updated_at.desc())
            .limit(20)
            .all()
        )
        return {"preparing": preparing, "ready": ready}

    def serialize_order(self, order: Order) -> dict:
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
            "items": [
                {
                    "id": i.id,
                    "product_id": i.product_id,
                    "product_name": i.product.name if i.product else None,
                    "quantity": i.quantity,
                    "unit_price": float(i.unit_price),
                    "notes": i.notes,
                }
                for i in order.items
            ],
        }
