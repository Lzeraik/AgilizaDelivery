import qrcode
import base64
import os
from io import BytesIO
from app.config import settings


class QRCodeService:
    def generate_tracking_url(self, token: str) -> str:
        return f"{settings.FRONTEND_URL}/track/{token}"

    def generate_qr_base64(self, token: str) -> str:
        url = self.generate_tracking_url(token)
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()

    def generate_qr_file(self, token: str) -> str:
        url = self.generate_tracking_url(token)
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        path = os.path.join(settings.UPLOAD_DIR, "qrcodes", f"{token}.png")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img.save(path)
        return f"/uploads/qrcodes/{token}.png"
