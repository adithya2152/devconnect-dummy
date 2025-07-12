import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    bio: "",
    location: "",
    skills: [],
    projects: [],        // <-- projects as array
    github_url: "",
    linkedin_url: "",
    stackoverflow_url: "",
    website_url: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [projectInput, setProjectInput] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setLoading(false);
        return;
      }
      const user = JSON.parse(userStr);
      const userEmail = user.email;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (error && error.code === "PGRST116") {
        // no profile yet, empty state
        setProfile({
          username: "",
          full_name: "",
          bio: "",
          location: "",
          skills: [],
          projects: [],
          github_url: "",
          linkedin_url: "",
          stackoverflow_url: "",
          website_url: "",
        });
      } else if (data) {
        setProfile({
          ...data,
          skills: data.skills || [],
          projects: data.projects || [],
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("You must be logged in");
      setLoading(false);
      return;
    }
    const user = JSON.parse(userStr);

    const updates = {
      ...profile,
      id: user.id,
      email: user.email,
      updated_at: new Date(),
    };

    const { error } = await supabase.from("profiles").upsert(updates);

    if (error) {
      alert("Error saving profile, check console");
      console.error("Error saving profile:", error.message);
    } else {
      alert("Profile saved!");
    }

    setLoading(false);
  };

  const handleSkillAdd = () => {
    if (skillInput && !profile.skills.includes(skillInput.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleSkillDelete = (skill) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s !== skill),
    });
  };

  const handleProjectAdd = () => {
    if (projectInput && !profile.projects.includes(projectInput.trim())) {
      setProfile({
        ...profile,
        projects: [...profile.projects, projectInput.trim()],
      });
      setProjectInput("");
    }
  };

  const handleProjectDelete = (project) => {
    setProfile({
      ...profile,
      projects: profile.projects.filter((p) => p !== project),
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography sx={{ color: "white" }}>Loading profile...</Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 5 }}>
      <Typography variant="h5" gutterBottom sx={{ color: "white" }}>
        Your Profile
      </Typography>
      <form onSubmit={handleSubmit}>
        {/* Username */}
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={profile.username}
          onChange={(e) =>
            setProfile({ ...profile, username: e.target.value })
          }
          InputLabelProps={{ style: { color: "white" } }}
          InputProps={{ style: { color: "white" } }}
        />

        {/* Full Name */}
        <TextField
          label="Full Name"
          fullWidth
          margin="normal"
          value={profile.full_name}
          onChange={(e) =>
            setProfile({ ...profile, full_name: e.target.value })
          }
          InputLabelProps={{ style: { color: "white" } }}
          InputProps={{ style: { color: "white" } }}
        />

        {/* Bio */}
        <TextField
          label="Bio"
          fullWidth
          multiline
          rows={3}
          margin="normal"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          InputLabelProps={{ style: { color: "white" } }}
          InputProps={{ style: { color: "white" } }}
        />

        {/* Location */}
        <TextField
          label="Location"
          fullWidth
          margin="normal"
          value={profile.location}
          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          InputLabelProps={{ style: { color: "white" } }}
          InputProps={{ style: { color: "white" } }}
        />

        {/* Skills */}
        <Box sx={{ my: 2 }}>
          <Typography sx={{ color: "white", mb: 1 }}>Skills</Typography>
          <TextField
            label="Add Skill"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSkillAdd();
              }
            }}
            fullWidth
            InputLabelProps={{ style: { color: "white" } }}
            InputProps={{ style: { color: "white" } }}
          />
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {profile.skills.map((skill, i) => (
              <Chip
                key={i}
                label={skill}
                onDelete={() => handleSkillDelete(skill)}
              />
            ))}
          </Box>
        </Box>

        {/* Projects */}
        <Box sx={{ my: 2 }}>
          <Typography sx={{ color: "white", mb: 1 }}>Projects</Typography>
          <TextField
            label="Add Project"
            value={projectInput}
            onChange={(e) => setProjectInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleProjectAdd();
              }
            }}
            fullWidth
            InputLabelProps={{ style: { color: "white" } }}
            InputProps={{ style: { color: "white" } }}
          />
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {profile.projects.map((project, i) => (
              <Chip
                key={i}
                label={project}
                onDelete={() => handleProjectDelete(project)}
              />
            ))}
          </Box>
        </Box>

        {/* URLs */}
        <TextField
          label="GitHub URL"
          fullWidth
          margin="normal"
          value={profile.github_url}
          onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
          InputLabelProps={{ style: { color: "white" } }}
          InputProps={{ style: { color: "white" } }}
        />
        <TextField
          label="LinkedIn URL"
          fullWidth
          margin="normal"
          value={profile.linkedin_url}
          onChange={(e) =>
            setProfile({ ...profile, linkedin_url: e.target.value })
          }
          InputLabelProps={{ style: { color: "white" } }}
          InputProps={{ style: { color: "white" } }}
        />
        <TextField
          label="StackOverflow URL"
          fullWidth
          margin="normal"
          value={profile.stackoverflow_url}
          onChange={(e) =>
            setProfile({ ...profile, stackoverflow_url: e.target.value })
          }
          InputLabelProps={{ style: { color: "white" } }}
          InputProps={{ style: { color: "white" } }}
        />
        <TextField
          label="Website URL"
          fullWidth
          margin="normal"
          value={profile.website_url}
          onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
          InputLabelProps={{ style: { color: "white" } }}
          InputProps={{ style: { color: "white" } }}
        />

        <Button type="submit" variant="contained" sx={{ mt: 3 }}>
          Save Profile
        </Button>
      </form>
    </Box>
  );
}
