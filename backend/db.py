import os
from supabase import create_client , Client
import logging
import datetime


try:
    url: str = os.environ["SUPABASE_URL"]
    key: str = os.environ["SUPABASE_KEY"]
    supabase:Client = create_client(url, key)
    logging.info("Connected to Supabase" , url, key)

except KeyError:
    # handle the case where the environment variable is not set
    print("Error: SUPABASE_URL or SUPABASE_KEY environment variable is not set")
    # you can also raise a custom exception or exit the program here

async def get_user_conv(user_id: str):
    try:
        response = (
            supabase.table("private_room_details")
            .select("*")
            .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
            .execute()
        )

        conversations = []
        for room in response.data:
            # Determine the "other" user's details based on the current user
            if room["user1_id"] == user_id:
                other_user = {
                    "id": room["user2_id"],
                    "full_name": room["user2_name"],
                    "username": room["user2_username"],
                    "avatar_url": room.get("user2_avatar_url"),
                }
            else:
                other_user = {
                    "id": room["user1_id"],
                    "full_name": room["user1_name"],
                    "username": room["user1_username"],
                    "avatar_url": room.get("user1_avatar_url"),
                }

            conversations.append({
                "room_id": room["room_id"],
                "room_meta": {
                    "name": room.get("name"),
                    "type": room.get("type"),
                    "description": room.get("description"),
                    "created_at": room.get("created_at"),
                    # Add more room fields if needed
                },
                "other_user": other_user
            })

        print("🗨️ Conversations via view:", conversations)
        return conversations

    except Exception as e:
        print(f"❌ Error fetching conversations: {e}")
        return []


async def get_last_message(room_id: str):
    try:
        response = (
            supabase.table("messages")
            .select("*")
            .eq("room_id", room_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if response.data:
            return response.data[0]  # the latest message
        else:
            return {"message": "No messages found or error occurred."}

    except Exception as e:
        print(f"Error fetching last message: {e}")
        return {"error": str(e)}

async def get_devs(q: str):
    try:
        response = (
            supabase.table("profiles")
            .select("id, full_name, username")  # Only fetch what you need
            .or_(f"full_name.ilike.%{q}%,username.ilike.%{q}%")  # Case-insensitive filter
            .execute()
        )
        return response.data
    except Exception as e:
        print(f"Error fetching developers: {e}")
        return None

async def get_projects_with_members():
    try:
        response = (
            supabase.table("app_projects")
            .select("*, app_project_members(*, profiles(*))")
            .execute()
        )
        return response.data
    except Exception as e:
        print(f"Error fetching projects with members: {e}")
        return None
    
async def get_projects(q:str):
    try:
        response = (
            supabase.table("app_projects")
            .select("id , title , detailed_description")
            .or_(f"title.ilike.%{q}%,detailed_description.ilike.%{q}%")
            .execute()
        )
        return response.data
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return None
    
async def get_user_profile(user_id: str):
    """Get user profile by ID"""
    try:
        response = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return response.data
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        return None
    

async def create_private_room(user1_id: str, user2_id: str):
    """Create or get existing private room between two users"""
    try:
        # Check if room already exists
        existing_room = (
            supabase.table("private_rooms")
            .select("*, rooms(*)")
            .or_(f"and(user1_id.eq.{user1_id},user2_id.eq.{user2_id}),and(user1_id.eq.{user2_id},user2_id.eq.{user1_id})")
            .execute()
        )
        
        if existing_room.data:
            return existing_room.data[0]
        
        # Create new room first
        room_data = {
            "name": f"Private chat",
            "type": "private",
            "created_by": user1_id,
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        
        room_result = supabase.table("rooms").insert(room_data).execute()
        
        if room_result.data:
            room_id = room_result.data[0]["id"]
            
            # Create private room entry
            private_room_data = {
                "room_id": room_id,
                "user1_id": user1_id,
                "user2_id": user2_id
            }
            
            private_result = supabase.table("private_rooms").insert(private_room_data).execute()
            
            # Add both users as room members
            members_data = [
                {"room_id": room_id, "user_id": user1_id, "role": "member"},
                {"room_id": room_id, "user_id": user2_id, "role": "member"}
            ]
            
            supabase.table("room_members").insert(members_data).execute()
            
            return {
                **private_result.data[0],
                "rooms": room_result.data[0]
            } if private_result.data else None
        
        return None
        
    except Exception as e:
        print(f"Error creating private room: {e}")
        return None

async def get_room_messages(room_id: str, limit: int = 50, offset: int = 0):
    """
    Fetch messages for a given room ID.
    Returns a list of messages, sorted by creation time.
    """
    try:
        response = (
            supabase
            .table("messages")
            .select("*")   
            .eq("room_id", room_id)
            .order("created_at", desc=False)
            .limit(limit)
            .offset(offset)
            .execute()
        )

        messages = response.data or []
        print(f"📩 {len(messages)} messages fetched for room {room_id}")
        return messages

    except Exception as e:
        print(f"❌ Error fetching messages for room {room_id}: {e}")
        return []


async def follow_user(follower_id: str, following_id: str):
    """Follow a user"""
    try:
        # Check if already following
        existing = (
            supabase.table("user_connections")
            .select("*")
            .eq("follower_id", follower_id)
            .eq("following_id", following_id)
            .execute()
        )
        
        if existing.data:
            return {"success": False, "message": "Already following"}
        
        connection_data = {
            "follower_id": follower_id,
            "following_id": following_id
        }
        
        result = supabase.table("user_connections").insert(connection_data).execute()
        return {"success": True, "data": result.data[0]} if result.data else {"success": False}
    except Exception as e:
        print(f"Error following user: {e}")
        return {"success": False, "message": str(e)}

async def unfollow_user(follower_id: str, following_id: str):
    """Unfollow a user"""
    try:
        response = (
            supabase.table("user_connections")
            .delete()
            .eq("follower_id", follower_id)
            .eq("following_id", following_id)
            .execute()
        )
        return {"success": True}
    except Exception as e:
        print(f"Error unfollowing user: {e}")
        return {"success": False, "message": str(e)}

async def check_following_status(follower_id: str, following_id: str):
    """Check if user is following another user"""
    try:
        response = (
            supabase.table("user_connections")
            .select("*")
            .eq("follower_id", follower_id)
            .eq("following_id", following_id)
            .execute()
        )
        return len(response.data) > 0
    except Exception as e:
        print(f"Error checking following status: {e}")
        return False

async def get_user_stats(user_id: str):
    """Get user statistics (followers, following, projects)"""
    try:
        # Get followers count
        followers = (
            supabase.table("user_connections")
            .select("*", count="exact")
            .eq("following_id", user_id)
            .execute()
        )
        
        # Get following count
        following = (
            supabase.table("user_connections")
            .select("*", count="exact")
            .eq("follower_id", user_id)
            .execute()
        )
        
        # Get projects count
        projects = (
            supabase.table("projects")
            .select("*", count="exact")
            .eq("profile_id", user_id)
            .execute()
        )
        
        return {
            "followers": followers.count or 0,
            "following": following.count or 0,
            "projects": projects.count or 0
        }
    except Exception as e:
        print(f"Error fetching user stats: {e}")
        return {"followers": 0, "following": 0, "projects": 0}
    

async def save_message(room_id: str, sender_id: str, content: str):
    """Save message to database"""
    try:
        print(f"💾 Saving message: room_id={room_id}, sender_id={sender_id}, content={content[:50]}...")
        
        message_data = {
            "room_id": room_id,
            "sender_id": sender_id,
            "content": content
        }
        
        result = supabase.table("messages").insert(message_data).execute()
        
        if result.data:
            print(f"✅ Message saved successfully: {result.data[0]}")
            return result.data[0]
        else:
            print("❌ No data returned from message insert")
            return None
            
    except Exception as e:
        print(f"❌ Error saving message: {e}")
        return None
    
# async def get_projects():

# Insert a new project into app_projects
def insert_app_project(project_data: dict):
    try:
        response = supabase.table("app_projects").insert(project_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error inserting project: {e}")
        return None

# Insert a new member into app_project_members
def insert_app_project_member(member_data: dict):
    try:
        response = supabase.table("app_project_members").insert(member_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error inserting project member: {e}")
        return None

async def get_notifications(user_id: str):
    try:
        notif = (supabase.table("notification_with_sender")
               .select("*")
               .eq("recipient_id", user_id)
               .order("created_at", desc=True)
               .limit(20)
               .execute())
        
        unread = (supabase.table("notifications")
                .select("count", count="exact")
                .eq("recipient_id", user_id)
                .eq("is_read", False)
                .execute())
        
        return {
            "notifications": notif.data,
            "unread_count": unread.count or 0
        }
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return {"notifications": [], "unread_count": 0}
    
    
async def get_unread_notifications(user_id: str):
    """
    Get all unread notifications for a specific user
    Returns: List of notification dictionaries or empty list on error
    """
    try:
        res = (supabase.table("notifications")
               .select("*")
               .eq("recipient_id", user_id)
               .eq("is_read", False)
               .execute()
              )
        return res.data
    except Exception as e:
        print(f"Error fetching unread notifications: {e}")
        return []

async def Update_notif(notif_id:str):
    try:
        res = (supabase.table("notifications")
               .update({
                   "is_read":True,
                   "read_at":datetime.datetime.now().isoformat()
               })
               .eq("id",notif_id)
               .execute()
               )
        
        return res.data
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return []   
    
async def get_communities(user_id: str):
    try:
        response = (supabase.table("rooms")
                    .select("*")
                    .eq("type",  "group")
                    .neq("created_by", user_id)
                    .execute()
                    )
        if response.data:
            return response.data
        else:
            return []
    except Exception as e:
        print(f"Error fetching communities: {e}")
        return []
    
async def get_comminities_by_userid(userId : str):
    try:
        response = ( supabase.table("rooms")
                    .select("*")
                    .eq("type", "group")
                    .eq("created_by", userId)
                    .execute()
                    )
        if response.data:
            return response.data
        else:
            return []
    except Exception as e:
        print(f"Error fetching communities: {e}")
        return []
    
async def get_joined_communities(user_id: str):
    """
    Fetch all communities (rooms) a user has joined with approved status
    Args:
        user_id: UUID of the user
    Returns:
        List of communities with details or empty list on error
    """
    try:
        # First get all room IDs the user is an approved member of
        member_response = (
            supabase.table("room_members")
            .select("room_id")
            .eq("user_id", user_id)
            .eq("request_status", True)
            .execute()
        )
        
        if not member_response.data:
            return []
            
        room_ids = [member["room_id"] for member in member_response.data]
        
        # Then fetch full details of those rooms
        rooms_response = (
            supabase.table("rooms")
            .select("*")
            .eq("type", "group")
            .in_("id", room_ids)
            .execute()
        )
        
        return rooms_response.data
        
    except Exception as e:
        print(f"Error fetching joined communities: {str(e)}")
        return []
    
async def add_community(room: dict):
    try:
        response = supabase.table("rooms").insert({"name":room['name'] , "type": "group" , "description":room['description'] , "created_by":room['created_by']}).execute()
        
        member_data = {
            "room_id":response.data[0]['id'],
            "user_id":room['created_by'],
            "role":"admin",
            "request_status": True
        }
        supabase.table("room_members").insert(member_data).execute()
        
        return response.data[0]
    except Exception as e:
        print(f"Error inserting community: {e}")
        return None

async def request_join_community(community_id: str, user_id: str):
    """
    Create a join request for a community (pending approval)
    """
    try:
        member_data = {
            "room_id": community_id,
            "user_id": user_id,
            "role": "member",
            "request_status": False
        }
        
        response = supabase.table("room_members").insert(member_data).execute()
        return response.data[0] if response.data else None
        
    except Exception as e:
        print(f"Error requesting to join community: {e}")
        return None

async def approve_join_request(request_id: str, admin_user_id: str):
    """
    Approve a join request (admin only)
    """
    try:
        # First get the request details
        request_response = (
            supabase.table("room_members")
            .select("*, rooms(*)")
            .eq("id", request_id)
            .eq("request_status", False)
            .single()
            .execute()
        )
        
        if not request_response.data:
            return {"success": False, "message": "Request not found"}
        
        request_data = request_response.data
        
        # Check if the current user is admin of the community
        if request_data["rooms"]["created_by"] != admin_user_id:
            return {"success": False, "message": "Only community admin can approve requests"}
        
        # Approve the request
        update_response = (
            supabase.table("room_members")
            .update({"request_status": True})
            .eq("id", request_id)
            .execute()
        )
        
        # Create approval notification
        notification_data = {
            "recipient_id": request_data["user_id"],
            "sender_id": admin_user_id,
            "type": "connection_request",
            "reference_id": request_data["room_id"],
            "message": f"Your request to join {request_data['rooms']['name']} has been approved!"
        }
        supabase.table("notifications").insert(notification_data).execute()
        
        return {"success": True}
        
    except Exception as e:
        print(f"Error approving join request: {e}")
        return {"success": False, "message": str(e)}

async def reject_join_request(request_id: str, admin_user_id: str):
    """
    Reject a join request (admin only)
    """
    try:
        # First get the request details
        request_response = (
            supabase.table("room_members")
            .select("*, rooms(*)")
            .eq("id", request_id)
            .eq("request_status", False)
            .single()
            .execute()
        )
        
        if not request_response.data:
            return {"success": False, "message": "Request not found"}
        
        request_data = request_response.data
        
        # Check if the current user is admin of the community
        if request_data["rooms"]["created_by"] != admin_user_id:
            return {"success": False, "message": "Only community admin can reject requests"}
        
        # Delete the request
        supabase.table("room_members").delete().eq("id", request_id).execute()
        
        # Create rejection notification
        notification_data = {
            "recipient_id": request_data["user_id"],
            "sender_id": admin_user_id,
            "type": "connection_request",
            "reference_id": request_data["room_id"],
            "message": f"Your request to join {request_data['rooms']['name']} has been rejected."
        }
        supabase.table("notifications").insert(notification_data).execute()
        
        return {"success": True}
        
    except Exception as e:
        print(f"Error rejecting join request: {e}")
        return {"success": False, "message": str(e)}

async def get_pending_requests(community_id: str):
    """
    Get all pending join requests for a community
    """
    try:
        response = (
            supabase.table("room_members")
            .select("*, profiles(*)")
            .eq("room_id", community_id)
            .eq("request_status", False)
            .execute()
        )
        return response.data
        
    except Exception as e:
        print(f"Error fetching pending requests: {e}")
        return []

async def create_join_notification(admin_id: str, requester_id: str, community_id: str):
    """
    Create notification for admin when someone requests to join
    """
    try:
        # Get community name
        community = await get_community_by_id(community_id)
        community_name = community["name"] if community else "Unknown Community"
        
        # Get requester profile
        requester_response = (
            supabase.table("profiles")
            .select("full_name, username")
            .eq("id", requester_id)
            .single()
            .execute()
        )
        
        requester_name = "Unknown User"
        if requester_response.data:
            requester_name = requester_response.data.get("full_name") or requester_response.data.get("username") or "Unknown User"
        
        notification_data = {
            "recipient_id": admin_id,
            "sender_id": requester_id,
            "type": "connection_request",
            "reference_id": community_id,
            "message": f"{requester_name} wants to join {community_name}"
        }
        
        supabase.table("notifications").insert(notification_data).execute()
        return True
        
    except Exception as e:
        print(f"Error creating join notification: {e}")
        return False

async def leave_community(community_id: str, user_id: str):
    """
    Remove user from community
    """
    try:
        response = (
            supabase.table("room_members")
            .delete()
            .eq("room_id", community_id)
            .eq("user_id", user_id)
            .execute()
        )
        return True
        
    except Exception as e:
        print(f"Error leaving community: {e}")
        return False

async def get_community_by_id(community_id: str):
    """
    Get community details by ID
    """
    try:
        response = (
            supabase.table("rooms")
            .select("*")
            .eq("id", community_id)
            .eq("type", "group")
            .single()
            .execute()
        )
        return response.data
        
    except Exception as e:
        print(f"Error fetching community by ID: {e}")
        return None

async def check_community_membership(community_id: str, user_id: str):
    """
    Check user's membership status in the community
    Returns: "approved", "pending", or None
    """
    try:
        response = (
            supabase.table("room_members")
            .select("request_status")
            .eq("room_id", community_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        
        if response.data:
            return "approved" if response.data["request_status"] else "pending"
        return None
        
    except Exception as e:
        print(f"Error checking community membership: {e}")
        return None

async def get_community_members(community_id: str):
    """
    Get all approved members of a community with their profile details
    """
    try:
        response = (
            supabase.table("room_members")
            .select("*, profiles(*)")
            .eq("room_id", community_id)
            .eq("request_status", True)
            .execute()
        )
        return response.data
        
    except Exception as e:
        print(f"Error fetching community members: {e}")
        return []