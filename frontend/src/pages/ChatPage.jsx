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
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import { useState, useEffect, useRef } from "react";
import NavBar from "../components/nav";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import useAuthGuard from "../hooks/useAuthGuarf";
import { format } from "date-fns";

export default function ChatPage() {
  useAuthGuard();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedDev, setSelectedDev] = useState(null);
  const [socket, setSocket] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations + Setup WebSocket
  useEffect(() => {
    
    const fetchConv = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/chat/conversations",
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (res.status === 200) {
          setConversations(res.data.conversations || []);
          setStatusMessage("");
        } else if (res.status === 204) {
          setConversations([]);
          setStatusMessage("No conversations yet. Start a new one!");
        } else {
          setStatusMessage("Unexpected error. Please try again later.");
          toast.error(`Unexpected status: ${res.status}`);
        }
      } catch (error) {
        console.error(error);
        setStatusMessage("Failed to fetch conversations.");
        toast.error("❌ Could not fetch conversations");
      }
    };

    fetchConv();

    if (!selectedDev) return;

    const token = localStorage.getItem("access_token");
    const ws = new WebSocket(`ws://localhost:8000/ws/${selectedDev.room_id}?token=${token}`);

    ws.onopen = () => {
      console.log("✅ WebSocket connection opened");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data.sender_id) {
        data.sender_id = userId; // fallback
      }
      
      // Check if message already exists to prevent duplicates
      setMessages(prev => {
        const exists = prev.some(m => m.id === data.id || 
          (m.content === data.content && m.sender_id === data.sender_id && m.timestamp === data.timestamp));
        return exists ? prev : [...prev, data];
      });
    };

    ws.onclose = () => console.log("🔌 WebSocket connection closed");

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [selectedDev]);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedDev) return;

      try {
        const res = await axios.get(
          `http://localhost:8000/chat/rooms/${selectedDev.room_id}/messages`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (res.status === 200) {
          setMessages(res.data.messages || []);
        } else {
          toast.error("❌ Failed to load messages");
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching room messages:", err);
        toast.error("❌ Could not fetch messages");
        setMessages([]);
      }
    };

    fetchMessages();
  }, [selectedDev]);

  const handleSelectConversation = (conv) => {
    setSelectedDev(conv);
  };

  const handleSend = () => {
    if (!newMessage.trim() || !socket || !selectedDev) return;

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

  return (
    <>
      <NavBar />
      <Box sx={{ display: "flex", height: "calc(100vh - 64px)", bgcolor: "#111827" }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 320,
            bgcolor: "#1f2937",
            color: "white",
            p: 2,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #374151",
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Conversations
          </Typography>

          <TextField
            variant="outlined"
            size="small"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#9CA3AF" }} />
                </InputAdornment>
              ),
              sx: { bgcolor: "#374151", color: "white", borderRadius: 2 },
            }}
            sx={{ mb: 2 }}
          />

          {statusMessage && (
            <Typography
              variant="body2"
              sx={{
                color: "#9CA3AF",
                backgroundColor: "#1f2937",
                border: "1px dashed #4b5563",
                p: 1,
                mb: 2,
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              {statusMessage}
            </Typography>
          )}

          <Box sx={{ overflowY: "auto", flex: 1 }}>
            <List disablePadding>
              {conversations
                .filter((conv) => {
                  const name = conv.other_user?.name || conv.other_user?.username || "";
                  return name.toLowerCase().includes(search.toLowerCase());
                })
                .map((conv) => (
                  <ListItem
                    key={conv.room_id}
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      cursor: "pointer",
                      bgcolor: selectedDev?.room_id === conv.room_id ? "#4b5563" : "#374151",
                      "&:hover": { bgcolor: "#4b5563" },
                    }}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "#6366f1" }}>
                        {(conv?.other_user?.full_name || conv?.other_user?.username|| "U")[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={conv.other_user?.full_name || conv.other_user?.username}
                      secondary={conv.last_message?.content || "No messages yet"}
                    />
                  </ListItem>
                ))}
            </List>
          </Box>
        </Box>

        {/* Chat Window */}
        {selectedDev ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)",
              color: "white",
              overflowX: "hidden",
              position: "relative",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #374151",
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(17, 24, 39, 0.5)",
              }}
            >
              <Avatar sx={{ bgcolor: "#6366f1", mr: 2 }}>
                {(selectedDev?.other_user?.full_name || selectedDev?.other_user?.username || "U")[0]}
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {selectedDev?.other_user?.full_name || selectedDev?.other_user?.username || "User"}
              </Typography>
            </Box>

            {/* Chat Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {messages.map((msg) => {
                const isMine = msg.sender_id?.toString() === userId;
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      mb: 1.5,
                    }}
                  >
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
              })}
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
                position: "sticky",
                bottom: 0,
                bgcolor: "#111827",
                borderTop: "1px solid #374151",
              }}
            >
              <TextField
                fullWidth
                placeholder="Type your message..."
                variant="outlined"
                autoComplete="off"
                inputProps={{
                  autoComplete: "off",
                  form: {
                    autoComplete: "off"
                  }
                }}
                size="small"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                sx={{
                  bgcolor: "#1f2937",
                  borderRadius: 2,
                  input: { color: "white" },
                  mr: 1,
                }}
              />
              <IconButton type="submit" sx={{ color: "#60a5fa" }}>
                <SendIcon />
              </IconButton>
            </Paper>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="h4" align="center" color="white">
              Welcome to DevConnect, the place to connect with developers
            </Typography>
            <Typography variant="h5" align="center" color="white" mt={2}>
              Select a dev to chat with
            </Typography>
          </Box>
        )}
      </Box>
      <Toaster />
    </>
  );
}