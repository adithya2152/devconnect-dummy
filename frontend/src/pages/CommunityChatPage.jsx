import {
  Box,
  Avatar,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Chip,
  Button,
  Drawer,
  AppBar,
  Toolbar,
  Divider,
  Badge,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import InfoIcon from "@mui/icons-material/Info";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import useAuthGuard from "../hooks/useAuthGuarf";

export default function CommunityChatPage() {
  useAuthGuard();
  const { communityId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch community details and setup WebSocket
  useEffect(() => {
    if (!communityId) return;

    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };

        // Get community details
        const detailsRes = await axios.get(
          `http://localhost:8000/communities/${communityId}`,
          { headers }
        );

        const { community: communityData, is_member, members: membersList } = detailsRes.data;

        if (!is_member) {
          toast.error("You must be a member to access this community");
          navigate("/community");
          return;
        }

        setCommunity(communityData);
        setMembers(membersList || []);

        // Get messages
        const messagesRes = await axios.get(
          `http://localhost:8000/communities/${communityId}/messages`,
          { headers }
        );

        setMessages(messagesRes.data.messages || []);
      } catch (error) {
        console.error("Error fetching community data:", error);
        toast.error("Failed to load community");
        navigate("/community");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();

    // Setup WebSocket connection
    const token = localStorage.getItem("access_token");
    const ws = new WebSocket(`ws://localhost:8000/ws/${communityId}?token=${token}`);

    ws.onopen = () => {
      console.log("✅ Community WebSocket connection opened");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data.sender_id) {
        data.sender_id = userId;
      }
      
      // Check if message already exists to prevent duplicates
      setMessages(prev => {
        const exists = prev.some(m => m.id === data.id || 
          (m.content === data.content && m.sender_id === data.sender_id && m.timestamp === data.timestamp));
        return exists ? prev : [...prev, data];
      });
    };

    ws.onclose = () => console.log("🔌 Community WebSocket connection closed");

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [communityId, userId, navigate]);

  const handleSend = () => {
    if (!newMessage.trim() || !socket || !community) return;

    const msgData = {
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    // Send to WebSocket
    socket.send(JSON.stringify(msgData));

    // Add to local UI with unique ID
    const localMsg = {
      ...msgData,
      sender_id: userId,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, localMsg]);
    setNewMessage("");
  };

  const getMemberById = (memberId) => {
    const member = members.find(m => m.user_id === memberId || m.profiles?.id === memberId);
    return member?.profiles || { full_name: "Unknown User", username: "unknown" };
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        bgcolor: "#111827",
        color: "white"
      }}>
        <Typography>Loading community...</Typography>
      </Box>
    );
  }

  if (!community) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        bgcolor: "#111827",
        color: "white"
      }}>
        <Typography>Community not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#111827" }}>
      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <AppBar 
          position="static" 
          sx={{ 
            bgcolor: "#1f2937",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate("/community")}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Avatar sx={{ bgcolor: "#6366f1", mr: 2 }}>
              <GroupIcon />
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {community.name}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                {members.length} members
              </Typography>
            </Box>

            <IconButton
              color="inherit"
              onClick={() => setShowMembers(!showMembers)}
            >
              <Badge badgeContent={members.length} color="primary">
                <InfoIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            background: "linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)",
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              height: "100%",
              color: "rgba(255,255,255,0.6)"
            }}>
              <Typography>No messages yet. Start the conversation!</Typography>
            </Box>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id?.toString() === userId;
              const sender = getMemberById(msg.sender_id);
              
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                    mb: 1.5,
                  }}
                >
                  {!isMine && (
                    <Avatar 
                      sx={{ 
                        bgcolor: "#6366f1", 
                        mr: 1, 
                        width: 32, 
                        height: 32,
                        fontSize: "0.8rem"
                      }}
                    >
                      {(sender.full_name || sender.username || "U")[0]}
                    </Avatar>
                  )}
                  
                  <Box
                    sx={{
                      maxWidth: "65%",
                      bgcolor: isMine ? "#4ade80" : "#f3f4f6",
                      color: "#111827",
                      px: 2,
                      py: 1.5,
                      borderRadius: "14px",
                      borderBottomRightRadius: isMine ? "0px" : "14px",
                      borderBottomLeftRadius: isMine ? "14px" : "0px",
                      boxShadow: 2,
                    }}
                  >
                    {!isMine && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: "bold", 
                          color: "#6366f1",
                          display: "block",
                          mb: 0.5
                        }}
                      >
                        {sender.full_name || sender.username || "Unknown User"}
                      </Typography>
                    )}
                    
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {msg.content}
                    </Typography>
                    
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.5,
                        fontSize: "11px",
                        color: "gray",
                        textAlign: isMine ? "right" : "left",
                      }}
                    >
                      {format(new Date(msg.created_at), "dd MMM yyyy, hh:mm a")}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        <Paper
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1,
            borderRadius: 0,
            bgcolor: "#1f2937",
            borderTop: "1px solid #374151",
          }}
        >
          <TextField
            fullWidth
            placeholder="Type your message..."
            variant="outlined"
            autoComplete="off"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={{
              bgcolor: "#374151",
              borderRadius: 2,
              input: { color: "white" },
              mr: 1,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { border: "none" },
              }
            }}
          />
          <IconButton 
            type="submit" 
            sx={{ color: "#60a5fa" }}
            disabled={!newMessage.trim()}
          >
            <SendIcon />
          </IconButton>
        </Paper>
      </Box>

      {/* Members Sidebar */}
      <Drawer
        anchor="right"
        open={showMembers}
        onClose={() => setShowMembers(false)}
        variant="temporary"
        PaperProps={{
          sx: {
            width: 300,
            bgcolor: "#1f2937",
            color: "white"
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Members ({members.length})
          </Typography>
          <Divider sx={{ borderColor: "#374151", mb: 2 }} />
          
          <List>
            {members.map((member) => (
              <ListItem key={member.id} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "#6366f1" }}>
                    {(member.profiles?.full_name || member.profiles?.username || "U")[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.profiles?.full_name || member.profiles?.username || "Unknown User"}
                  secondary={
                    <Chip 
                      label={member.role} 
                      size="small" 
                      color={member.role === "admin" ? "secondary" : "default"}
                      sx={{ mt: 0.5 }}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}