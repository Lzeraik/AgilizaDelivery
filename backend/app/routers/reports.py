from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from app.database import get_db
from app.services.report_service import ReportService
from app.utils.security import require_admin

router = APIRouter(prefix="/reports", tags=["Relatórios"])


@router.get("/daily")
def daily_summary(target_date: Optional[date] = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    return ReportService(db).daily_summary(target_date)


@router.get("/top-products")
def top_products(days: int = Query(30, ge=1, le=365), limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db), _=Depends(require_admin)):
    return ReportService(db).top_products(days, limit)


@router.get("/peak-hours")
def peak_hours(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db), _=Depends(require_admin)):
    return ReportService(db).peak_hours(days)


@router.get("/revenue")
def revenue_by_period(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db), _=Depends(require_admin)):
    return ReportService(db).revenue_by_period(days)
