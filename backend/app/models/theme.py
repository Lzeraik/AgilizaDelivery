from sqlalchemy import Column, Integer, String, JSON, Enum as SAEnum
from app.database import Base
import enum


class ScreenType(str, enum.Enum):
    totem = "totem"
    kitchen = "kitchen"
    display = "display"
    attendant = "attendant"


class ThemeConfig(Base):
    __tablename__ = "theme_configs"

    id = Column(Integer, primary_key=True, index=True)
    screen = Column(SAEnum(ScreenType), unique=True, nullable=False)
    primary_color = Column(String(20), default="#FF4B2B")
    secondary_color = Column(String(20), default="#FF416C")
    bg_color = Column(String(20), default="#FFFFFF")
    text_color = Column(String(20), default="#1F2937")
    accent_color = Column(String(20), default="#F59E0B")
    font_family = Column(String(100), default="Inter")
    logo_url = Column(String(500), nullable=True)
    banners = Column(JSON, default=list)
    restaurant_name = Column(String(150), default="Restaurante")
