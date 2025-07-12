import { useState, useEffect, useCallback } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  TextField,
  InputAdornment,
  debounce,
  ListItem,
  CircularProgress,
  styled,
  Paper,
  ListItemText,
  List,
  ListItemAvatar,
  Badge,
  Popover,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import AccountCircle from "@mui/icons-material/AccountCircle";
import SearchIcon from "@mui/icons-material/Search";
import { useAuthStatus } from "../hooks/useAuthStatus";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import ProfileModal from "./ProfileModal";
import { formatDistanceToNow } from "date-fns";
import NotificationsIcon from "@mui/icons-material/Notifications";

const SearchResults = styled(Paper)(() => ({
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 999,
  maxHeight: 300,
  overflowY: "auto",
  borderRadius: "0 0 10px 10px",
  backgroundColor: "#1f2937",
  color: "white",
}));

export default function NavBar() {
  const { isAuthenticated, loading } = useAuthStatus();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [Searchloading, setSearchLoading] = useState(false);
  const [profileModal, setProfileModal] = useState({
    open: false,
    userId: null,
  });
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8000/notifications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (res.data.status !== "success") {
        throw new Error("Failed to fetch notifications");
      }
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  const markAllAsRead = async () => {
  try {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    const res = await axios.patch(
      "http://localhost:8000/notifications/mark-all-read",
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      }
    );
    fetchNotifications(); // Refresh notifications
    if(!res.data.status === "success") throw new Error("Failed to update notifications");
    toast.success("All notifications marked as read");
  } catch (error) {
    console.error("Error marking all as read:", error);
    toast.error("Failed to update notifications");
  }
};

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.is_read) {
        await axios.patch(
          `http://localhost:8000/notifications/${notification.id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
      }

      // Handle notification action
      switch (notification.type) {
        case "message":
          // navigate("/chat");
          break;
        case "project_invite":
          // navigate(`/projects/${notification.reference_id}`);
          break;
        case "connection_request":
          // navigate(`/profile/${notification.sender_id}`);
          break;
        default:
          break;
      }

      setNotificationAnchor(null);
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Error handling notification:", error);
      toast.error("Failed to process notification");
    }
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
    // Mark all as read when opening the notifications popover
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const res = await axios.post(
        "http://localhost:8000/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      if (res.data.status !== "success") throw new Error("Logout failed");

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.response?.data?.detail || "Logout failed");
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    debouncedSearch(val);
  };

  const handleSelect = (item) => {
    if (item.type === "dev") {
      setProfileModal({ open: true, userId: item.id });
      setSearchQuery(""); // Clear search
      setSearchResults([]);
    }
  };

  const debouncedSearch = debounce(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const [devRes, projectRes] = await Promise.all([
        axios.get(`http://localhost:8000/search/devs?q=${query}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }),
        axios.get(`http://localhost:8000/search/projects?q=${query}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }),
      ]);
      const combined = [
        ...devRes.data.map((item) => ({ type: "dev", ...item })),
        ...projectRes.data.map((item) => ({ type: "project", ...item })),
      ];
      setSearchResults(combined);
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error.response?.data?.detail || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }, 300);

  const handleMessage = async (userId, userProfile) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/chat/create-room",
        { other_user_id: userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (response.data.room) {
        navigate("/chat", {
          state: {
            selectedRoom: response.data.room,
            selectedUser: userProfile,
          },
        });
      }
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to start conversation");
    }
  };

  if (loading) return null;

  return (
    <AppBar position="static" sx={{ backgroundColor: "#1F2937" }}>
      <Toaster position="top-right" reverseOrder={false} />
      <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ color: "#fff", textDecoration: "none", flexGrow: 1 }}
        >
          DevConnect
        </Typography>

        {isAuthenticated && (
          <Box sx={{ position: "relative", width: 300 }}>
            <TextField
              placeholder="Search devs or projects..."
              size="small"
              variant="outlined"
              value={searchQuery}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#9CA3AF" }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: "#374151",
                  color: "white",
                  borderRadius: 2,
                  input: { color: "white" },
                },
              }}
              fullWidth
            />

            {searchQuery && (
              <SearchResults>
                {Searchloading ? (
                  <ListItem>
                    <CircularProgress size={20} /> &nbsp; Loading...
                  </ListItem>
                ) : searchResults.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No results found" />
                  </ListItem>
                ) : (
                  <List>
                    {searchResults.map((item, idx) => (
                      <ListItem
                        key={idx}
                        onClick={() => handleSelect(item)}
                        component="div"
                        sx={{ cursor: "pointer" }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: "#6366f1" }}>
                            {item.username?.charAt(0)?.toUpperCase() ||
                              item.full_name?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            item.full_name ||
                            item.name ||
                            item.username ||
                            item.title ||
                            item.detailed_description ||
                            "Unnamed Developer / Project"
                          }
                          secondary={item.type}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </SearchResults>
            )}
          </Box>
        )}

        {isAuthenticated ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button color="inherit" component={RouterLink} to="/dashboard">
              Feed
            </Button>
            <Button color="inherit" component={RouterLink} to="/chat">
              Chat
            </Button>
            <Button color="inherit" component={RouterLink} to="/projects">
              Projects
            </Button>
            <Button color="inherit" component={RouterLink} to="/community">
              Communities
            </Button>

            <IconButton
              color="inherit"
              onClick={handleNotificationOpen}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Popover
              open={Boolean(notificationAnchor)}
              anchorEl={notificationAnchor}
              onClose={handleNotificationClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              sx={{
                "& .MuiPaper-root": {
                  width: 360,
                  maxHeight: 500,
                  overflow: "auto",
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="h6">Notifications</Typography>
                  {unreadCount > 0 && (
                    <Button
                      size="small"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      Mark all as read
                    </Button>
                  )}
                </Box>
                {notifications.length === 0 ? (
                  <Typography variant="body2" sx={{ p: 2, textAlign: "center" }}>
                    No notifications
                  </Typography>
                ) : (
                  <List dense>
                    {notifications.map((notification) => (
                      <ListItem
                        key={notification.id}
                        button
                        onClick={() => handleNotificationClick(notification)}
                        sx={{
                          bgcolor: notification.is_read
                            ? "inherit"
                            : "action.selected",
                          borderRadius: 1,
                          mb: 0.5,
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={notification.sender?.avatar_url}
                            alt={notification.sender?.username}
                          >
                            {notification.sender?.username?.charAt(0) || "U"}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={notification.message}
                          secondary={formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true,
                            }
                          )}
                          primaryTypographyProps={{
                            fontWeight: notification.is_read
                              ? "normal"
                              : "bold",
                            color: notification.is_read
                              ? "text.secondary"
                              : "text.primary",
                          }}
                          secondaryTypographyProps={{
                            color: "text.secondary",
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Popover>

            <IconButton
              onClick={handleMenuOpen}
              color="inherit"
              size="large"
              sx={{ ml: 2 }}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate("/my_profile");
                }}
              >
                Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleLogout();
                }}
                disabled={logoutLoading}
              >
                {logoutLoading ? "Logging out..." : "Logout"}
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Register
            </Button>
          </>
        )}
      </Toolbar>

      <ProfileModal
        open={profileModal.open}
        onClose={() => setProfileModal({ open: false, userId: null })}
        userId={profileModal.userId}
        onMessage={handleMessage}
      />
    </AppBar>
  );
}