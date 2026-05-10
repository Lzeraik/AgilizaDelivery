from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.order import Order, OrderStatus
from app.services.nfe_service import NFCeService
from app.utils.security import require_admin

router = APIRouter(prefix="/nfe", tags=["NFC-e"])

_nfe_counter: dict = {}


def _next_nfe_number() -> str:
    from datetime import date
    today = date.today().isoformat()
    _nfe_counter[today] = _nfe_counter.get(today, 0) + 1
    return str(_nfe_counter[today]).zfill(9)


@router.post("/emitir/{order_id}")
def emitir_nfce(order_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if not order.payment or order.payment.status.value != "approved":
        raise HTTPException(status_code=400, detail="Pedido não possui pagamento aprovado")

    numero = _next_nfe_number()
    result = NFCeService().emitir(order, numero)
    order.nfe_chave = result["chave"]
    order.nfe_status = result["status"]
    db.commit()
    return result


@router.get("/{order_id}")
def get_nfe_status(order_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return {"order_id": order.id, "nfe_chave": order.nfe_chave, "nfe_status": order.nfe_status}
