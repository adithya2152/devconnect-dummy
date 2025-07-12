from db import get_user_conv, get_last_message, get_user_profile, get_user_stats, check_following_status, follow_user , unfollow_user,create_private_room,get_room_messages
from fastapi import FastAPI , Depends , status , HTTPException
from fastapi.responses import JSONResponse
from auth.dependencies import get_current_user_id
from pydantic import BaseModel


chat_app = FastAPI()

class CreateRoomRequest(BaseModel):
    other_user_id: str

class FollowUserRequest(BaseModel):
    user_id: str

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

@chat_app.get("/conversations")
async def get_conversations(user_id: str = Depends(get_current_user_id)):
    """
    Fetch all 1-1 conversations the authenticated user is part of.
    """
    try:
        print("✅ Fetched userId through auth:", user_id)
        conversations = await get_user_conv(user_id)  # Expected to return a list of private_rooms

        if not conversations:
            return JSONResponse(
                status_code=status.HTTP_204_NO_CONTENT,
                content={"message": "No conversations found."}
            )

        # Fetch last messages for each room
        enriched_conversations = []
        for conv in conversations:
            room_id = conv["room_id"]
            last_msg = await get_last_message(room_id)

            enriched_conversations.append({
                **conv,  # All room details
                "last_message": last_msg  # Might be None if no messages yet
            })

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"conversations": enriched_conversations}
        )

    except Exception as e:
        print(f"❌ Error fetching conversations for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching conversations."

            
        )
    

@chat_app.post("/create-room")
async def create_room(
    request: CreateRoomRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Create or get existing private room between two users
    """
    try:
        room = await create_private_room(user_id, request.other_user_id)
        
        if not room:    
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create room"
            )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"room": room}
        )
    
    except Exception as e:
        print(f"❌ Error creating room: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while creating room."
        )

@chat_app.get("/rooms/{room_id}/messages")
async def get_messages(
    room_id: str,
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get messages for a specific room
    """
    try:
        messages = await get_room_messages(room_id, limit, offset)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"messages": messages or []}
        )
    
    except Exception as e:
        print(f"❌ Error fetching messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching messages."
        )

@chat_app.get("/profile/{user_id}")
async def get_profile(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get user profile for chat/search
    """
    try:
        profile = await get_user_profile(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"profile": profile}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching profile."
        )

@chat_app.get("/profile/{user_id}/detailed")
async def get_detailed_profile(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get detailed user profile with stats and following status
    """
    try:
        profile = await get_user_profile(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get user stats
        stats = await get_user_stats(user_id)
        
        # Check if current user is following this user
        is_following = await check_following_status(current_user_id, user_id)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "profile": profile,
                "stats": stats,
                "is_following": is_following,
                "is_own_profile": current_user_id == user_id
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching detailed profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching detailed profile."
        )
    
@chat_app.post("/follow")
async def follow_user_route(
    request: FollowUserRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Follow a user
    """
    try:
        if current_user_id == request.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot follow yourself"
            )
        
        result = await follow_user(current_user_id, request.user_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to follow user")
            )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Successfully followed user"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error following user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while following user."
        )

@chat_app.post("/unfollow")
async def unfollow_user_route(
    request: FollowUserRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Unfollow a user
    """
    try:
        result = await unfollow_user(current_user_id, request.user_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to unfollow user")
            )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Successfully unfollowed user"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error unfollowing user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while unfollowing user."
        )
