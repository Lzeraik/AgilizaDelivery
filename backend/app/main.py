import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    _seed_default_data()
    yield


def _seed_default_data():
    from app.database import SessionLocal
    from app.models.user import User, UserRole
    from app.models.theme import ThemeConfig, ScreenType
    from app.utils.security import hash_password

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == settings.ADMIN_EMAIL).first():
            admin = User(
                name=settings.ADMIN_NAME,
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            db.commit()

        # Seed default themes
        default_themes = {
            ScreenType.totem: {"primary_color": "#FF4B2B", "secondary_color": "#FF416C", "bg_color": "#FFFFFF", "text_color": "#1F2937", "accent_color": "#F59E0B", "restaurant_name": settings.APP_NAME},
            ScreenType.kitchen: {"primary_color": "#10B981", "secondary_color": "#059669", "bg_color": "#111827", "text_color": "#F9FAFB", "accent_color": "#F59E0B", "restaurant_name": settings.APP_NAME},
            ScreenType.display: {"primary_color": "#3B82F6", "secondary_color": "#2563EB", "bg_color": "#0F172A", "text_color": "#F8FAFC", "accent_color": "#22C55E", "restaurant_name": settings.APP_NAME},
            ScreenType.attendant: {"primary_color": "#8B5CF6", "secondary_color": "#7C3AED", "bg_color": "#FFFFFF", "text_color": "#1F2937", "accent_color": "#F59E0B", "restaurant_name": settings.APP_NAME},
        }
        for screen, defaults in default_themes.items():
            if not db.query(ThemeConfig).filter(ThemeConfig.screen == screen).first():
                db.add(ThemeConfig(screen=screen, **defaults, banners=[]))
        db.commit()
    finally:
        db.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="SaaS de Pedidos para Restaurante — API completa com 4 telas interligadas em tempo real.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routers
from app.routers import auth, users, categories, products, orders, kitchen, display, payments, themes, stock, reports, nfe, uploads  # noqa
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(kitchen.router)
app.include_router(display.router)
app.include_router(payments.router)
app.include_router(themes.router)
app.include_router(stock.router)
app.include_router(reports.router)
app.include_router(nfe.router)
app.include_router(uploads.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}
