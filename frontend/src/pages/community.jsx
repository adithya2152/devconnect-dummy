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
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import NavBar from "../components/nav";

export default function Communities() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [explore, setExplore] = useState([]);
  const [joined, setJoined] = useState([]);
  const [hosted, setHosted] = useState([]);
  const [dialog, setDialog] = useState({ open: false, community: null });
  const [create, setCreate] = useState({ name: "", description: "" });
  

  const BASE = "http://localhost:8000"; // change to actual API

  useEffect(() => {
    axios.get(`${BASE}/communities/explore` , {headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }}).then((res) => setExplore(res.data));
    axios.get(`${BASE}/communities/joined`, {headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }}).then((res) => setJoined(res.data));
    axios.get(`${BASE}/communities/hosted`, {headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }}).then((res) => setHosted(res.data));
  }, []);

  const handleJoin = async (id) => {
    try {
      await axios.post(`${BASE}/communities/${id}/joinReq`);
      toast.success("Joined!");
      setDialog({ open: false, community: null });
      // refresh lists if needed
    } catch (err) {
      toast.error("Failed to join" , err);
    }
  };

  const handleCreate = async () => {
    try {
       const response = await axios.post(
      `${BASE}/communities/add`,
      create,  // Request body
      {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          'Content-Type': 'application/json'
        }
      }
    );
     
      if(response.status !== 201){
        
        throw new Error(response.data.detail);
      }
      toast.success("Created!");
      setCreate({ name: "", description: "" });
    } catch (err) {
      toast.error("Failed to create" , err);
    }
  };

  const CommunityCard = ({ comm, isJoined, isHost }) => (
    <Card sx={{ bgcolor: "#1f2937", color: "white" }}>
      <CardContent>
        <Typography variant="h6">{comm.name}</Typography>
        <Typography variant="body2" color="gray" noWrap>
          {comm.description}
        </Typography>
      </CardContent>
      <CardActions>
        {isHost ? (
          <Button size="small" variant="outlined" color="secondary">
            Manage
          </Button>
        ) : isJoined ? (
          <Button size="small" variant="outlined" disabled>
            Joined
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            onClick={() => setDialog({ open: true, community: comm })}
          >
            Join
          </Button>
        )}
        <Tooltip title="Copy join link">
          <IconButton
            onClick={() =>
              navigator.clipboard.writeText(
                `${window.location.origin}/communities/join/${comm.id}`
              )
            }
            color="primary"
          >
            <ShareIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );

  const renderTabContent = () => {
    switch (tab) {
      case 0:
        return (
          <Grid container spacing={2}>
            {explore
              .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
              .map((c) => (
                <Grid item xs={12} sm={6} md={4} key={c.id}>
                  <CommunityCard comm={c} isJoined={joined.some(j => j.id === c.id)} />
                </Grid>
              ))}
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            {joined.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <CommunityCard comm={c} isJoined />
              </Grid>
            ))}
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            {hosted.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <CommunityCard comm={c} isHost />
              </Grid>
            ))}
          </Grid>
        );
      // Updated Create Community Tab
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
        sx={{
          bgcolor: "#4f46e5",
          "&:hover": { bgcolor: "#4338ca" },
          px: 4,
          py: 1.5,
          fontSize: "1rem"
        }}
        fullWidth
      >
        Create Community
      </Button>
    </Box>
  );
    }
  };

  return (
    <>
      <NavBar />
      <Box sx={{ p: 4, backgroundColor: "#0f172a", minHeight: "100vh", color: "#fff" }}>
        <Typography variant="h4" mb={3}>
          Communities
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit">
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
              }}
            />
          )}
          {renderTabContent()}
        </Box>
      </Box>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, community: null })}>
        <DialogTitle>{dialog.community?.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialog.community?.description}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, community: null })}>Cancel</Button>
          <Button onClick={() => handleJoin(dialog.community.id)} autoFocus variant="contained">
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
