from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from pydantic import BaseModel
from auth.dependencies import get_current_user_id
from db import get_unread_notifications, get_notifications, Update_notif

notifrouter = APIRouter()

class NotificationResponse(BaseModel):
    id: str
    type: str
    message: str
    is_read: bool
    created_at: datetime
    sender: dict

class NotificationsResponse(BaseModel):
    status: str
    notifications: List[NotificationResponse]
    unread_count: int

@notifrouter.get("/notifications", response_model=NotificationsResponse)
async def notifications(current_user_id: str = Depends(get_current_user_id)):
    try:
        result = await get_notifications(current_user_id)
        print("✅ result from notifications extracted:", result)
        return {
            "status": "success",
            "notifications": result["notifications"],
            "unread_count": result["unread_count"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@notifrouter.patch("/notifications/mark-all-read")
async def mark_all_notifications_as_read(
    current_user_id: str = Depends(get_current_user_id)
):
    try:
        # Get all unread notifications for the user
        unread_notifications = await get_unread_notifications(current_user_id)
        
        # Mark all as read
        for notification in unread_notifications:
            await Update_notif(notification['id'])
        
            print("✅ All notifications marked as read")
            
        return {"status": "success", "message": "All notifications marked as read"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )