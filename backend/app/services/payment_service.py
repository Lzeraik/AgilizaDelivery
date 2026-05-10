import uuid
from abc import ABC, abstractmethod
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.order import Order, OrderStatus
from app.schemas.payment import PaymentCreate


class TEFProvider(ABC):
    """Interface base para provedores TEF reais (Cielo, Stone, Rede, etc.)"""

    @abstractmethod
    def initiate(self, amount: float, method: str) -> dict:
        pass

    @abstractmethod
    def confirm(self, transaction_id: str) -> dict:
        pass

    @abstractmethod
    def cancel(self, transaction_id: str) -> dict:
        pass


class SimulatedTEFProvider(TEFProvider):
    """Simulação de TEF para desenvolvimento. Substitua por um provider real."""

    def initiate(self, amount: float, method: str) -> dict:
        transaction_id = f"SIM-{uuid.uuid4().hex[:12].upper()}"
        qr_pix = None
        if method == "pix":
            qr_pix = f"00020126580014BR.GOV.BCB.PIX0136{uuid.uuid4()}5204000053039865802BR5925Restaurante Exemplo6009SAO PAULO62070503***6304{uuid.uuid4().hex[:4].upper()}"
        return {
            "transaction_id": transaction_id,
            "status": "waiting",
            "message": "Aguardando confirmação na máquina",
            "qr_code_pix": qr_pix,
        }

    def confirm(self, transaction_id: str) -> dict:
        return {
            "transaction_id": transaction_id,
            "status": "approved",
            "message": "Pagamento aprovado",
            "authorization_code": uuid.uuid4().hex[:6].upper(),
        }

    def cancel(self, transaction_id: str) -> dict:
        return {"transaction_id": transaction_id, "status": "cancelled", "message": "Pagamento cancelado"}


class PaymentService:
    def __init__(self, db: Session, provider: TEFProvider = None):
        self.db = db
        self.provider = provider or SimulatedTEFProvider()

    def initiate_payment(self, data: PaymentCreate) -> dict:
        order = self.db.query(Order).filter(Order.id == data.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
        if order.payment and order.payment.status == PaymentStatus.approved:
            raise HTTPException(status_code=400, detail="Pedido já pago")

        tef_result = self.provider.initiate(float(order.total_amount), data.method.value)

        payment = self.db.query(Payment).filter(Payment.order_id == data.order_id).first()
        if not payment:
            payment = Payment(
                order_id=data.order_id,
                method=data.method,
                amount=order.total_amount,
                status=PaymentStatus.pending,
                transaction_id=tef_result["transaction_id"],
                tef_response=tef_result,
            )
            self.db.add(payment)
        else:
            payment.transaction_id = tef_result["transaction_id"]
            payment.tef_response = tef_result
            payment.method = data.method

        self.db.commit()
        return tef_result

    def confirm_payment(self, order_id: int) -> Payment:
        payment = self.db.query(Payment).filter(Payment.order_id == order_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Pagamento não encontrado")

        tef_result = self.provider.confirm(payment.transaction_id)
        payment.status = PaymentStatus.approved
        payment.tef_response = tef_result

        order = self.db.query(Order).filter(Order.id == order_id).first()
        if order:
            order.status = OrderStatus.pending

        self.db.commit()
        self.db.refresh(payment)
        return payment

    def fail_payment(self, order_id: int) -> Payment:
        payment = self.db.query(Payment).filter(Payment.order_id == order_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Pagamento não encontrado")
        payment.status = PaymentStatus.failed
        self.db.commit()
        self.db.refresh(payment)
        return payment
