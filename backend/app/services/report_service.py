from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, Integer, extract
from app.models.order import Order, OrderItem, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.models.product import Product


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def daily_summary(self, target_date: date = None) -> dict:
        target_date = target_date or date.today()
        orders = (
            self.db.query(Order)
            .filter(
                cast(Order.created_at, Date) == target_date,
                Order.status != OrderStatus.cancelled,
            )
            .all()
        )
        total_revenue = sum(float(o.total_amount) for o in orders if o.payment and o.payment.status == PaymentStatus.approved)
        return {
            "date": target_date.isoformat(),
            "total_orders": len(orders),
            "total_revenue": total_revenue,
            "pending": sum(1 for o in orders if o.status == OrderStatus.pending),
            "preparing": sum(1 for o in orders if o.status == OrderStatus.preparing),
            "ready": sum(1 for o in orders if o.status == OrderStatus.ready),
            "delivered": sum(1 for o in orders if o.status == OrderStatus.delivered),
        }

    def top_products(self, days: int = 30, limit: int = 10) -> list:
        since = datetime.utcnow() - timedelta(days=days)
        results = (
            self.db.query(
                Product.id,
                Product.name,
                func.sum(OrderItem.quantity).label("total_sold"),
                func.sum(OrderItem.quantity * OrderItem.unit_price).label("total_revenue"),
            )
            .join(OrderItem, Product.id == OrderItem.product_id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.created_at >= since, Order.status != OrderStatus.cancelled)
            .group_by(Product.id, Product.name)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "product_id": r.id,
                "product_name": r.name,
                "total_sold": int(r.total_sold),
                "total_revenue": float(r.total_revenue),
            }
            for r in results
        ]

    def peak_hours(self, days: int = 30) -> list:
        since = datetime.utcnow() - timedelta(days=days)
        results = (
            self.db.query(
                extract("hour", Order.created_at).label("hour"),
                func.count(Order.id).label("order_count"),
            )
            .filter(Order.created_at >= since, Order.status != OrderStatus.cancelled)
            .group_by(extract("hour", Order.created_at))
            .order_by(extract("hour", Order.created_at))
            .all()
        )
        return [{"hour": int(r.hour), "order_count": int(r.order_count)} for r in results]

    def revenue_by_period(self, days: int = 30) -> list:
        since = datetime.utcnow() - timedelta(days=days)
        results = (
            self.db.query(
                cast(Order.created_at, Date).label("date"),
                func.count(Order.id).label("orders"),
                func.sum(Order.total_amount).label("revenue"),
            )
            .join(Payment, Order.id == Payment.order_id)
            .filter(
                Order.created_at >= since,
                Payment.status == PaymentStatus.approved,
            )
            .group_by(cast(Order.created_at, Date))
            .order_by(cast(Order.created_at, Date))
            .all()
        )
        return [
            {
                "date": r.date.isoformat(),
                "orders": int(r.orders),
                "revenue": float(r.revenue or 0),
            }
            for r in results
        ]
