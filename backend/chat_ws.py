from fastapi import WebSocket, WebSocketDisconnect, APIRouter , HTTPException
from typing import Dict, List
from jose import jwt, JWTError
import os
import json
import jwt 
from db import save_message

ws_router = APIRouter()

room_connection: Dict[str, List[WebSocket]] = {}

# Replace with your actual values
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") 

ALGORITHM = "HS256"

 
def decode_jwt_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM] , audience="authenticated")
        return payload.get("sub")  # or payload["user_id"] if stored like that
    except JWTError as e:
        print("❌ JWT Decode Error:", e)
        return None

@ws_router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=1008)
        return

    user_id = decode_jwt_token(token)

    if not user_id:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    if room_id not in room_connection:
        room_connection[room_id] = []

    room_connection[room_id].append(websocket)
    print(f"✅ Client [{user_id}] connected to room {room_id}")

    try:
        while True:
            data = await websocket.receive_text()
            parsed = json.loads(data)

            content = parsed["content"]
            saved = await save_message(room_id, user_id, content)

            if saved:
                broadcastData = json.dumps({
                    "sender_id": user_id,
                    "content": content,
                    "room_id": room_id,
                    "created_at": saved.get("created_at", "now")
                })

                for client in room_connection[room_id]:
                    await client.send_text(broadcastData)
            else:
                print("❌ Error saving message")

    except WebSocketDisconnect:
        room_connection[room_id].remove(websocket)
        print(f"❌ Client [{user_id}] disconnected from room {room_id}")

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
