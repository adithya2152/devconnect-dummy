import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Avatar,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Language as WebsiteIcon,
  LocationOn as LocationIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProfileModal({ open, onClose, userId, onMessage }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/chat/profile/${userId}/detailed`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      setFollowLoading(true);
      const endpoint = profile.is_following ? '/chat/unfollow' : '/chat/follow';
      
      await axios.post(
        `http://localhost:8000${endpoint}`,
        { user_id: userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      setProfile(prev => ({
        ...prev,
        is_following: !prev.is_following,
        stats: {
          ...prev.stats,
          followers: prev.is_following 
            ? prev.stats.followers - 1 
            : prev.stats.followers + 1
        }
      }));

      toast.success(profile.is_following ? 'Unfollowed successfully' : 'Following successfully');
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    onMessage(userId, profile?.profile);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!profile) return null;

  const { profile: userProfile, stats, is_following, is_own_profile } = profile;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1f2937',
          color: 'white',
          borderRadius: 3
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ position: 'relative', p: 3, pb: 2 }}>
          <IconButton
            onClick={onClose}
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8, 
              color: 'white' 
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Profile Info */}
          <Box display="flex" alignItems="center" gap={3} mb={3}>
            <Avatar
              src={userProfile.avatar}
              sx={{ 
                width: 80, 
                height: 80,
                bgcolor: '#6366f1',
                fontSize: '2rem'
              }}
            >
              {userProfile.full_name?.[0] || userProfile.username?.[0] || 'U'}
            </Avatar>
            
            <Box flex={1}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {userProfile.full_name || userProfile.username || 'Unknown User'}
              </Typography>
              
              {userProfile.username && (
                <Typography variant="body2" color="rgba(255,255,255,0.7)" gutterBottom>
                  @{userProfile.username}
                </Typography>
              )}

              {userProfile.location && (
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocationIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {userProfile.location}
                  </Typography>
                </Box>
              )}

              {/* Stats */}
              <Stack direction="row" spacing={3} mt={2}>
                <Box textAlign="center">
                  <Typography variant="h6" fontWeight="bold">
                    {stats.followers}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.7)">
                    Followers
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h6" fontWeight="bold">
                    {stats.following}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.7)">
                    Following
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h6" fontWeight="bold">
                    {stats.projects}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.7)">
                    Projects
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* Bio */}
          {userProfile.bio && (
            <Typography variant="body2" color="rgba(255,255,255,0.8)" mb={2}>
              {userProfile.bio}
            </Typography>
          )}

          {/* Skills */}
          {userProfile.skills && userProfile.skills.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Skills
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {userProfile.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(99, 102, 241, 0.2)',
                      color: '#a8b8ff',
                      border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Social Links */}
          <Stack direction="row" spacing={2} mt={2}>
            {userProfile.github_url && (
              <IconButton
                component="a"
                href={userProfile.github_url}
                target="_blank"
                sx={{ color: 'white' }}
              >
                <GitHubIcon />
              </IconButton>
            )}
            {userProfile.linkedin_url && (
              <IconButton
                component="a"
                href={userProfile.linkedin_url}
                target="_blank"
                sx={{ color: 'white' }}
              >
                <LinkedInIcon />
              </IconButton>
            )}
            {userProfile.website_url && (
              <IconButton
                component="a"
                href={userProfile.website_url}
                target="_blank"
                sx={{ color: 'white' }}
              >
                <WebsiteIcon />
              </IconButton>
            )}
          </Stack>
        </Box>
      </DialogContent>

      {/* Actions */}
      {!is_own_profile && (
        <>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={is_following ? <PersonRemoveIcon /> : <PersonAddIcon />}
              onClick={handleFollow}
              disabled={followLoading}
              sx={{
                color: 'white',
                borderColor: is_following ? '#ef4444' : '#6366f1',
                '&:hover': {
                  borderColor: is_following ? '#dc2626' : '#4f46e5',
                  bgcolor: is_following ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)'
                }
              }}
            >
              {followLoading ? (
                <CircularProgress size={20} />
              ) : (
                is_following ? 'Unfollow' : 'Follow'
              )}
            </Button>
            
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              onClick={handleMessage}
              sx={{
                background: 'linear-gradient(90deg, #00c6ff, #0072ff)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #0072ff, #00c6ff)',
                }
              }}
            >
              Message
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}