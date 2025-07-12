from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from auth.dependencies import get_current_user_id
from db import (
    get_communities,
    get_joined_communities,
    get_comminities_by_userid,
    add_community,
    join_community,
    leave_community,
    get_community_by_id,
    check_community_membership,
    get_community_members
)

community_app = FastAPI()

# Response Models
class CommunityResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    type: str
    created_by: str
    created_at: str

class CreateCommunityRequest(BaseModel):
    name: str
    description: str

class JoinCommunityRequest(BaseModel):
    community_id: str

# API Endpoints
@community_app.get("/explore", response_model=List[CommunityResponse])
async def explore_communities(user_id: str = Depends(get_current_user_id)):
    """
    Get all public communities available to explore
    """
    try:
        communities = await get_communities(user_id)
        if communities is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No communities found"
            )
        return communities
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching communities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching communities."
        )

@community_app.get("/joined", response_model=List[CommunityResponse])
async def joined_communities(user_id: str = Depends(get_current_user_id)):
    """
    Get all communities the current user has joined
    """
    try:
        communities = await get_joined_communities(user_id)
        if communities is None:
            return []
        return communities
    except Exception as e:
        print(f"❌ Error fetching joined communities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching joined communities."
        )

@community_app.get("/hosted", response_model=List[CommunityResponse])
async def hosted_communities(user_id: str = Depends(get_current_user_id)):
    """
    Get all communities hosted/created by the current user
    """
    try:
        communities = await get_comminities_by_userid(user_id)
        if communities is None:
            return []
        return communities
    except Exception as e:
        print(f"❌ Error fetching hosted communities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching hosted communities."
        )

@community_app.post("/add", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community(
    request: CreateCommunityRequest, 
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new community
    - Sets the creator as admin
    - Default type is 'group'
    """
    try:
        # Validate input
        if not request.name or len(request.name) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Community name must be at least 3 characters"
            )

        # Prepare community data
        community_data = {
            "name": request.name,
            "description": request.description,
            "type": "group",
            "created_by": user_id
        }

        # Create community
        community = await add_community(community_data)
        if not community:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create community"
            )

        return community

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating community: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while creating community."
        )

@community_app.post("/join")
async def join_community_route(
    request: JoinCommunityRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Join a community
    """
    try:
        # Check if community exists
        community = await get_community_by_id(request.community_id)
        if not community:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Community not found"
            )

        # Check if already a member
        is_member = await check_community_membership(request.community_id, user_id)
        if is_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already a member of this community"
            )

        # Join community
        result = await join_community(request.community_id, user_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to join community"
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Successfully joined community", "community": community}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error joining community: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while joining community."
        )

@community_app.post("/leave/{community_id}")
async def leave_community_route(
    community_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Leave a community
    """
    try:
        # Check if user is a member
        is_member = await check_community_membership(community_id, user_id)
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not a member of this community"
            )

        # Leave community
        result = await leave_community(community_id, user_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to leave community"
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Successfully left community"}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error leaving community: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while leaving community."
        )

@community_app.get("/{community_id}")
async def get_community_details(
    community_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get community details with membership status
    """
    try:
        community = await get_community_by_id(community_id)
        if not community:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Community not found"
            )

        is_member = await check_community_membership(community_id, user_id)
        members = await get_community_members(community_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "community": community,
                "is_member": is_member,
                "is_owner": community["created_by"] == user_id,
                "members": members,
                "member_count": len(members) if members else 0
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching community details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching community details."
        )

@community_app.get("/{community_id}/messages")
async def get_community_messages(
    community_id: str,
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get messages for a community (requires membership)
    """
    try:
        # Check if user is a member
        is_member = await check_community_membership(community_id, user_id)
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Must be a member to view messages"
            )

        from db import get_room_messages
        messages = await get_room_messages(community_id, limit, offset)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"messages": messages or []}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching community messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching messages."
        )