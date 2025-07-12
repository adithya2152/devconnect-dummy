import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Divider,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import AddIcon from "@mui/icons-material/Add";
import ChatIcon from "@mui/icons-material/Chat";
import GroupIcon from "@mui/icons-material/Group";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PendingIcon from "@mui/icons-material/Pending";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import NavBar from "../components/nav";
import useAuthGuard from "../hooks/useAuthGuarf";

export default function Communities() {
  useAuthGuard();
  const navigate = useNavigate();
  const { action, communityId } = useParams();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [explore, setExplore] = useState([]);
  const [joined, setJoined] = useState([]);
  const [hosted, setHosted] = useState([]);
  const [dialog, setDialog] = useState({ open: false, community: null });
  const [create, setCreate] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState({});

  const BASE = "http://localhost:8000";

  useEffect(() => {
    fetchCommunities();
  }, []);

  // Handle direct community join via URL
  useEffect(() => {
    if (action === "join" && communityId) {
      handleDirectJoin(communityId);
    }
  }, [action, communityId]);

  const fetchCommunities = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
      
      const [exploreRes, joinedRes, hostedRes] = await Promise.all([
        axios.get(`${BASE}/communities/explore`, { headers }),
        axios.get(`${BASE}/communities/joined`, { headers }),
        axios.get(`${BASE}/communities/hosted`, { headers })
      ]);

      setExplore(exploreRes.data);
      setJoined(joinedRes.data);
      setHosted(hostedRes.data);

      // Fetch pending requests for hosted communities
      const requestsPromises = hostedRes.data.map(community =>
        axios.get(`${BASE}/communities/pending-requests/${community.id}`, { headers })
          .then(res => ({ [community.id]: res.data.requests }))
          .catch(() => ({ [community.id]: [] }))
      );

      const requestsResults = await Promise.all(requestsPromises);
      const requestsMap = requestsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setPendingRequests(requestsMap);

    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to load communities");
    }
  };

  const handleDirectJoin = async (communityId) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
      
      // Get community details first
      const detailsRes = await axios.get(`${BASE}/communities/${communityId}`, { headers });
      const { community, membership_status } = detailsRes.data;

      if (membership_status === "approved") {
        // Already a member, go to chat
        navigate(`/community/${communityId}/chat`);
      } else if (membership_status === "pending") {
        // Request already pending
        toast.info("Your join request is pending approval");
        navigate("/community");
      } else {
        // Show join dialog
        setDialog({ open: true, community });
      }
    } catch (error) {
      console.error("Error handling direct join:", error);
      toast.error("Community not found or access denied");
      navigate("/community");
    }
  };

  const handleRequestJoin = async (communityId) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
      
      await axios.post(`${BASE}/communities/request-join`, 
        { community_id: communityId }, 
        { headers }
      );
      
      toast.success("Join request sent! Waiting for admin approval.");
      setDialog({ open: false, community: null });
      
      // Refresh communities
      await fetchCommunities();
      
    } catch (error) {
      console.error("Error requesting to join community:", error);
      toast.error(error.response?.data?.detail || "Failed to send join request");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
      
      await axios.post(`${BASE}/communities/approve-request`, 
        { request_id: requestId }, 
        { headers }
      );
      
      toast.success("Request approved successfully!");
      await fetchCommunities();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(error.response?.data?.detail || "Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
      
      await axios.post(`${BASE}/communities/reject-request`, 
        { request_id: requestId }, 
        { headers }
      );
      
      toast.success("Request rejected successfully!");
      await fetchCommunities();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(error.response?.data?.detail || "Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (communityId) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
      
      await axios.post(`${BASE}/communities/leave/${communityId}`, {}, { headers });
      
      toast.success("Successfully left community");
      await fetchCommunities();
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error(error.response?.data?.detail || "Failed to leave community");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const headers = { 
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        'Content-Type': 'application/json'
      };
      
      const response = await axios.post(`${BASE}/communities/add`, create, { headers });
      
      if (response.status === 201) {
        toast.success("Community created successfully!");
        setCreate({ name: "", description: "" });
        await fetchCommunities();
        setTab(2); // Switch to hosted tab
        
        // Navigate to the new community chat
        navigate(`/community/${response.data.id}/chat`);
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error(error.response?.data?.detail || "Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityChat = (communityId) => {
    navigate(`/community/${communityId}/chat`);
  };

  const generateJoinLink = (communityId) => {
    const link = `${window.location.origin}/community/join/${communityId}`;
    navigator.clipboard.writeText(link);
    toast.success("Join link copied to clipboard!");
  };

  const getMembershipStatus = (communityId) => {
    // Check if user is a member of this community
    return joined.some(j => j.id === communityId) ? "approved" : null;
  };

  const CommunityCard = ({ comm, isJoined, isHost }) => {
    const pendingCount = pendingRequests[comm.id]?.length || 0;
    
    return (
      <Card 
        sx={{ 
          bgcolor: "#1f2937", 
          color: "white",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
          }
        }}
      >
        <CardContent sx={{ flex: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <GroupIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {comm.name}
            </Typography>
            {isHost && pendingCount > 0 && (
              <Badge badgeContent={pendingCount} color="error">
                <PendingIcon color="warning" />
              </Badge>
            )}
          </Box>
          
          <Typography variant="body2" color="rgba(255,255,255,0.7)" mb={2}>
            {comm.description || "No description available"}
          </Typography>
          
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip 
              label={isHost ? "Owner" : isJoined ? "Member" : "Public"} 
              size="small"
              color={isHost ? "secondary" : isJoined ? "success" : "default"}
            />
            <Chip 
              label={`Created ${new Date(comm.created_at).toLocaleDateString()}`}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Pending Requests for Hosted Communities */}
          {isHost && pendingCount > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                Pending Requests ({pendingCount})
              </Typography>
              <List dense sx={{ maxHeight: 150, overflow: "auto" }}>
                {pendingRequests[comm.id]?.map((request) => (
                  <ListItem 
                    key={request.id}
                    sx={{ 
                      bgcolor: "rgba(255,193,7,0.1)", 
                      borderRadius: 1, 
                      mb: 0.5,
                      p: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 24, height: 24, fontSize: "0.8rem" }}>
                        {(request.profiles?.full_name || request.profiles?.username || "U")[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={request.profiles?.full_name || request.profiles?.username || "Unknown User"}
                      primaryTypographyProps={{ fontSize: "0.8rem" }}
                    />
                    <Box display="flex" gap={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => handleApproveRequest(request.id)}
                        sx={{ color: "success.main" }}
                        disabled={loading}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRejectRequest(request.id)}
                        sx={{ color: "error.main" }}
                        disabled={loading}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
        
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Box display="flex" gap={1} width="100%">
            {isHost ? (
              <>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={() => handleCommunityChat(comm.id)}
                  sx={{ flex: 1 }}
                >
                  Manage
                </Button>
                <Tooltip title="Copy join link">
                  <IconButton
                    onClick={() => generateJoinLink(comm.id)}
                    color="primary"
                    size="small"
                  >
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : isJoined ? (
              <>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={() => handleCommunityChat(comm.id)}
                  sx={{ flex: 1 }}
                >
                  Chat
                </Button>
                <Tooltip title="Leave community">
                  <IconButton
                    onClick={() => handleLeave(comm.id)}
                    color="error"
                    size="small"
                    disabled={loading}
                  >
                    <ExitToAppIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setDialog({ open: true, community: comm })}
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Request to Join
                </Button>
                <Tooltip title="Copy join link">
                  <IconButton
                    onClick={() => generateJoinLink(comm.id)}
                    color="primary"
                    size="small"
                  >
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </CardActions>
      </Card>
    );
  };

  const renderTabContent = () => {
    switch (tab) {
      case 0:
        return (
          <Grid container spacing={3}>
            {explore
              .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
              .map((c) => (
                <Grid item xs={12} sm={6} md={4} key={c.id}>
                  <CommunityCard 
                    comm={c} 
                    isJoined={getMembershipStatus(c.id) === "approved"}
                    isHost={hosted.some(h => h.id === c.id)}
                  />
                </Grid>
              ))}
            {explore.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="rgba(255,255,255,0.6)">
                    No communities found
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            {joined.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <CommunityCard comm={c} isJoined />
              </Grid>
            ))}
            {joined.length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="rgba(255,255,255,0.6)">
                    You haven't joined any communities yet
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => setTab(0)}
                    sx={{ mt: 2, color: "white", borderColor: "white" }}
                  >
                    Explore Communities
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            {hosted.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <CommunityCard comm={c} isHost />
              </Grid>
            ))}
            {hosted.length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="rgba(255,255,255,0.6)">
                    You haven't created any communities yet
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => setTab(3)}
                    sx={{ mt: 2, color: "white", borderColor: "white" }}
                  >
                    Create Community
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        );
      case 3:
        return (
          <Box sx={{ 
            maxWidth: 500, 
            mx: "auto", 
            mt: 4,
            p: 4,
            bgcolor: "#1e293b",
            borderRadius: 2,
            boxShadow: 3
          }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, color: "#fff" }}>
              Create New Community
            </Typography>
            
            <TextField
              fullWidth
              label="Community Name"
              value={create.name}
              onChange={(e) => setCreate({ ...create, name: e.target.value })}
              sx={{ 
                mb: 3,
                "& .MuiInputLabel-root": { color: "#94a3b8" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#334155" },
                  "&:hover fieldset": { borderColor: "#4f46e5" },
                  "&.Mui-focused fieldset": { borderColor: "#4f46e5" }
                },
                input: { color: "#fff" }
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <TextField
              fullWidth
              label="Description"
              value={create.description}
              multiline
              rows={4}
              onChange={(e) => setCreate({ ...create, description: e.target.value })}
              sx={{ 
                mb: 3,
                "& .MuiInputLabel-root": { color: "#94a3b8" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#334155" },
                  "&:hover fieldset": { borderColor: "#4f46e5" },
                  "&.Mui-focused fieldset": { borderColor: "#4f46e5" }
                },
                textarea: { color: "#fff" }
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleCreate}
              disabled={!create.name.trim() || !create.description.trim() || loading}
              sx={{
                bgcolor: "#4f46e5",
                "&:hover": { bgcolor: "#4338ca" },
                px: 4,
                py: 1.5,
                fontSize: "1rem"
              }}
              fullWidth
            >
              {loading ? "Creating..." : "Create Community"}
            </Button>
          </Box>
        );
    }
  };

  return (
    <>
      <NavBar />
      <Box sx={{ p: 4, backgroundColor: "#0f172a", minHeight: "100vh", color: "#fff" }}>
        <Typography variant="h4" mb={3} fontWeight="bold">
          Communities
        </Typography>

        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          textColor="inherit"
          sx={{
            "& .MuiTab-root": {
              color: "rgba(255,255,255,0.7)",
              "&.Mui-selected": {
                color: "#fff"
              }
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#4f46e5"
            }
          }}
        >
          <Tab label="Explore" />
          <Tab label="My Communities" />
          <Tab label="Hosted by Me" />
          <Tab label="Create New" />
        </Tabs>

        <Box mt={3}>
          {tab === 0 && (
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities..."
              sx={{
                mb: 3,
                input: { color: "white" },
                bgcolor: "#1e293b",
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#334155" },
                  "&:hover fieldset": { borderColor: "#4f46e5" },
                  "&.Mui-focused fieldset": { borderColor: "#4f46e5" }
                }
              }}
            />
          )}
          {renderTabContent()}
        </Box>
      </Box>

      {/* Join Community Dialog */}
      <Dialog 
        open={dialog.open} 
        onClose={() => setDialog({ open: false, community: null })}
        PaperProps={{
          sx: {
            bgcolor: "#1f2937",
            color: "white"
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GroupIcon />
          Request to Join {dialog.community?.name}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.7)" }}>
            {dialog.community?.description}
          </DialogContentText>
          <Typography variant="body2" sx={{ mt: 2, color: "rgba(255,255,255,0.5)" }}>
            Your request will be sent to the community admin for approval. You'll be notified once it's reviewed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialog({ open: false, community: null })}
            sx={{ color: "rgba(255,255,255,0.7)" }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleRequestJoin(dialog.community?.id)} 
            autoFocus 
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: "#4f46e5",
              "&:hover": { bgcolor: "#4338ca" }
            }}
          >
            {loading ? "Sending..." : "Send Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}