from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "AgilizaDelivery"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql://agiliza:agiliza123@db:5432/agiliza_delivery"

    SECRET_KEY: str = "troque-esta-chave-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    ADMIN_NAME: str = "Administrador"
    ADMIN_EMAIL: str = "admin@restaurante.com"
    ADMIN_PASSWORD: str = "admin123"

    FRONTEND_URL: str = "http://localhost:3000"
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
    ]

    # NFC-e SEFAZ
    SEFAZ_AMBIENTE: int = 2
    SEFAZ_UF: str = "SP"
    SEFAZ_CNPJ: str = "00000000000000"
    SEFAZ_IE: str = "000000000000"
    SEFAZ_RAZAO_SOCIAL: str = "Restaurante Exemplo LTDA"
    SEFAZ_NOME_FANTASIA: str = "Restaurante Exemplo"
    SEFAZ_LOGRADOURO: str = "Rua Exemplo"
    SEFAZ_NUMERO: str = "100"
    SEFAZ_BAIRRO: str = "Centro"
    SEFAZ_MUNICIPIO: str = "São Paulo"
    SEFAZ_CEP: str = "01310100"
    SEFAZ_TELEFONE: str = "1100000000"
    SEFAZ_CSC: str = "00000000-0000-0000-0000-000000000000"
    SEFAZ_CSC_ID: str = "000001"
    CERTIFICADO_PATH: str = "certificado.pfx"
    CERTIFICADO_SENHA: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
