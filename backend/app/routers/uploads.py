import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.config import settings
from app.utils.security import require_admin

router = APIRouter(prefix="/uploads", tags=["Upload de Arquivos"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/{folder}")
async def upload_file(
    folder: str,
    file: UploadFile = File(...),
    _=Depends(require_admin),
):
    if folder not in ("products", "banners", "logos"):
        raise HTTPException(status_code=400, detail="Pasta inválida")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.")

    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Arquivo muito grande. Máximo: {settings.MAX_FILE_SIZE_MB}MB")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(settings.UPLOAD_DIR, folder, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "wb") as f:
        f.write(contents)

    return {"url": f"/uploads/{folder}/{filename}", "filename": filename}
