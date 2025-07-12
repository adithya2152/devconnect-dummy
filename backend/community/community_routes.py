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
    request_join_community,
    approve_join_request,
    reject_join_request,
    leave_community,
    get_community_by_id,
    check_community_membership,
    get_community_members,
    get_pending_requests,
    create_join_notification
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

class ApproveRejectRequest(BaseModel):
    request_id: str

# API Endpoints
@community_app.get("/explore", response_model=List[CommunityResponse])
async def explore_communities(user_id: str = Depends(get_current_user_id)):
    """
    Get all public communities available to explore
    """
    try:
        communities = await get_communities(user_id)
        if communities is None:
            return []
        return communities
    except Exception as e:
        print(f"❌ Error fetching communities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching communities."
        )

@community_app.get("/joined", response_model=List[CommunityResponse])
async def joined_communities(user_id: str = Depends(get_current_user_id)):
    """
    Get all communities the current user has joined (approved members only)
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

@community_app.post("/request-join")
async def request_join_community_route(
    request: JoinCommunityRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Request to join a community (creates pending request)
    """
    try:
        # Check if community exists
        community = await get_community_by_id(request.community_id)
        if not community:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Community not found"
            )

        # Check if already a member or has pending request
        membership_status = await check_community_membership(request.community_id, user_id)
        if membership_status == "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already a member of this community"
            )
        elif membership_status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Join request already pending"
            )

        # Create join request
        result = await request_join_community(request.community_id, user_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create join request"
            )

        # Create notification for admin
        await create_join_notification(community["created_by"], user_id, request.community_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Join request sent successfully", "community": community}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error requesting to join community: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while requesting to join community."
        )

@community_app.post("/approve-request")
async def approve_request_route(
    request: ApproveRejectRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Approve a join request (admin only)
    """
    try:
        result = await approve_join_request(request.request_id, user_id)
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to approve request")
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Request approved successfully"}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error approving request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while approving request."
        )

@community_app.post("/reject-request")
async def reject_request_route(
    request: ApproveRejectRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Reject a join request (admin only)
    """
    try:
        result = await reject_join_request(request.request_id, user_id)
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to reject request")
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Request rejected successfully"}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error rejecting request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while rejecting request."
        )

@community_app.get("/pending-requests/{community_id}")
async def get_pending_requests_route(
    community_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get pending join requests for a community (admin only)
    """
    try:
        # Check if user is admin of the community
        community = await get_community_by_id(community_id)
        if not community or community["created_by"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only community admin can view pending requests"
            )

        requests = await get_pending_requests(community_id)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"requests": requests}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching pending requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching pending requests."
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
        membership_status = await check_community_membership(community_id, user_id)
        if membership_status != "approved":
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

        membership_status = await check_community_membership(community_id, user_id)
        members = await get_community_members(community_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "community": community,
                "membership_status": membership_status,
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
    Get messages for a community (requires approved membership)
    """
    try:
        # Check if user is an approved member
        membership_status = await check_community_membership(community_id, user_id)
        if membership_status != "approved":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Must be an approved member to view messages"
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