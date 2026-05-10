from pydantic import BaseModel
from typing import Optional, List
from app.models.theme import ScreenType


class ThemeUpdate(BaseModel):
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    bg_color: Optional[str] = None
    text_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None
    logo_url: Optional[str] = None
    banners: Optional[List[str]] = None
    restaurant_name: Optional[str] = None


class ThemeResponse(BaseModel):
    id: int
    screen: ScreenType
    primary_color: str
    secondary_color: str
    bg_color: str
    text_color: str
    accent_color: str
    font_family: str
    logo_url: Optional[str]
    banners: List[str]
    restaurant_name: str

    model_config = {"from_attributes": True}
