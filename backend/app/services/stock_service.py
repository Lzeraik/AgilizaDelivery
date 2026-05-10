from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.stock import Stock
from app.models.order import Order, OrderItem


class StockService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create(self, product_id: int) -> Stock:
        stock = self.db.query(Stock).filter(Stock.product_id == product_id).first()
        if not stock:
            stock = Stock(product_id=product_id, quantity=0, min_quantity=5)
            self.db.add(stock)
            self.db.commit()
            self.db.refresh(stock)
        return stock

    def update_quantity(self, product_id: int, quantity: int, min_quantity: int = None) -> Stock:
        stock = self.get_or_create(product_id)
        stock.quantity = quantity
        if min_quantity is not None:
            stock.min_quantity = min_quantity
        self.db.commit()
        self.db.refresh(stock)
        return stock

    def decrement_for_order(self, order: Order):
        for item in order.items:
            stock = self.get_or_create(item.product_id)
            if stock.quantity > 0:
                stock.quantity = max(0, stock.quantity - item.quantity)
        self.db.commit()

    def get_low_stock(self):
        stocks = self.db.query(Stock).all()
        return [s for s in stocks if s.quantity <= s.min_quantity]

    def list_all(self):
        return self.db.query(Stock).all()
