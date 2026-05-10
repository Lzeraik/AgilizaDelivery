import json
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._channels: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self._channels:
            self._channels[channel] = []
        self._channels[channel].append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self._channels:
            self._channels[channel] = [
                ws for ws in self._channels[channel] if ws != websocket
            ]

    async def broadcast(self, channel: str, event: str, data: dict):
        message = json.dumps({"event": event, "data": data})
        dead = []
        for websocket in self._channels.get(channel, []):
            try:
                await websocket.send_text(message)
            except Exception:
                dead.append(websocket)
        for ws in dead:
            self.disconnect(ws, channel)

    async def broadcast_to_channels(self, channels: List[str], event: str, data: dict):
        for channel in channels:
            await self.broadcast(channel, event, data)

    def count(self, channel: str) -> int:
        return len(self._channels.get(channel, []))


manager = ConnectionManager()
