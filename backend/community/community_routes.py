from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from auth.dependencies import get_current_user_id
from db import (
    get_communities,
    get_joined_communities,
    get_comminities_by_userid,
    add_community
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