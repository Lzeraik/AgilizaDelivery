from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.theme import ThemeConfig, ScreenType
from app.schemas.theme import ThemeUpdate, ThemeResponse
from app.utils.security import require_admin

router = APIRouter(prefix="/themes", tags=["Temas"])

DEFAULT_THEMES = {
    ScreenType.totem: {"primary_color": "#FF4B2B", "secondary_color": "#FF416C", "bg_color": "#FFFFFF", "text_color": "#1F2937", "accent_color": "#F59E0B"},
    ScreenType.kitchen: {"primary_color": "#10B981", "secondary_color": "#059669", "bg_color": "#111827", "text_color": "#F9FAFB", "accent_color": "#F59E0B"},
    ScreenType.display: {"primary_color": "#3B82F6", "secondary_color": "#2563EB", "bg_color": "#0F172A", "text_color": "#F8FAFC", "accent_color": "#22C55E"},
    ScreenType.attendant: {"primary_color": "#8B5CF6", "secondary_color": "#7C3AED", "bg_color": "#FFFFFF", "text_color": "#1F2937", "accent_color": "#F59E0B"},
}


def _get_or_create_theme(db: Session, screen: ScreenType) -> ThemeConfig:
    theme = db.query(ThemeConfig).filter(ThemeConfig.screen == screen).first()
    if not theme:
        defaults = DEFAULT_THEMES.get(screen, {})
        theme = ThemeConfig(screen=screen, **defaults, banners=[])
        db.add(theme)
        db.commit()
        db.refresh(theme)
    return theme


@router.get("/", response_model=List[ThemeResponse])
def list_themes(db: Session = Depends(get_db)):
    return [_get_or_create_theme(db, s) for s in ScreenType]


@router.get("/{screen}", response_model=ThemeResponse)
def get_theme(screen: ScreenType, db: Session = Depends(get_db)):
    return _get_or_create_theme(db, screen)


@router.put("/{screen}", response_model=ThemeResponse)
def update_theme(screen: ScreenType, data: ThemeUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    theme = _get_or_create_theme(db, screen)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(theme, key, value)
    db.commit()
    db.refresh(theme)
    return theme
