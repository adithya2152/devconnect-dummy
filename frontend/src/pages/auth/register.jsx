import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  IconButton,
  InputAdornment,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Visibility, VisibilityOff, CloudUpload, CheckCircle } from '@mui/icons-material';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Basic info, 2: OTP, 3: Password & Resume
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  // const [resume, setResume] = useState(null);
  const [error, setError] = useState(null);
  // const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    github: '',
    linkedin: '',
    interests: '',
    blog: '',
    research: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // const handleResumeUpload = (e) => {
  //   const file = e.target.files[0];
  //   if (file && file.type === 'application/pdf') {
  //     setResume(file);
  //   } else {
  //     alert('Please upload a PDF file');
  //   }
  // };

 const handleSendOtp = async () => {
  if (!formData.email) {
    alert('Please enter your email first');
    return;
  }
  
  try {
    setIsSubmitting(true);
    
    const response = await axios.post(
      'http://localhost:8000/send-otp',
      { email: formData.email },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      setOtpSent(true);
      setStep(2);
    }
  } catch (error) {
    console.error("OTP sending failed:", error);
    alert(error.response?.data?.detail || 'Failed to send OTP. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

 const verifyOtp = async () => {
  if (otp.length !== 6) {
    alert('Please enter a valid 6-digit OTP');
    return;
  }

  try {
    setIsSubmitting(true);
    
    const response = await axios.post(
      'http://localhost:8000/verify-otp',
      {
        email: formData.email,  // Include email
        otp: otp
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    if (response.data.success) {
      setStep(3); // Only proceed if verification succeeds
    } else {
      alert(response.data.message || 'OTP verification failed');
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    alert(error.response?.data?.detail || 'Error verifying OTP. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.email || !formData.password) {
    setError('Email and password are required');
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    const response = await axios.post(
      'http://localhost:8000/register',
      {
        email: formData.email,
        password: formData.password
      },
      {
        headers: {
           'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      }
    );
    const data = response.data;
    if (data.status === "success") {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate('/dashboard');
    }
  } catch (error) {
    console.error("Registration error:", error);
    setError(
      error.response?.data?.detail || 
      'Registration failed. Please try again.'
    );
  } finally {
    setIsSubmitting(false);
  }
};

  const isStep1Valid = () => {
    return formData.email && formData.username;
  };

  const isStep3Valid = () => {
    return formData.password.length >= 8 ;
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
        minHeight: '100vh',
        py: 8,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={12}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            background: 'rgba(18, 18, 18, 0.6)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          }}
        >
          {/* Left Info Panel */}
          <Box
            sx={{
              flex: 1,
              p: 5,
              background: 'linear-gradient(135deg, #232526, #414345)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {step === 1 ? 'Create Your Profile' : step === 2 ? 'Verify Email' : 'Secure Your Account'}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {step === 1 ? 'Join our developer community with just a few details.'
                  : step === 2 ? `We've sent a 6-digit code to ${formData.email}`
                  : 'Add a password and resume to complete registration'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
              {[1, 2, 3].map((stepNumber) => (
                <Box
                  key={stepNumber}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: step >= stepNumber ? '#00c6ff' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Right Form Panel */}
          <Box sx={{ flex: 1.5, p: 5 }}>
            {step === 1 && (
              <form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      name="email"
                      label="Email"
                      fullWidth
                      required
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        sx: {
                          color: 'white',
                          background: '#1e1e1e',
                          borderRadius: 2,
                        },
                      }}
                      InputLabelProps={{ sx: { color: '#bbb' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="username"
                      label="Username"
                      fullWidth
                      required
                      value={formData.username}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        sx: {
                          color: 'white',
                          background: '#1e1e1e',
                          borderRadius: 2,
                        },
                      }}
                      InputLabelProps={{ sx: { color: '#bbb' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      onClick={handleSendOtp}
                      disabled={!isStep1Valid() || isSubmitting}
                      variant="contained"
                      sx={{
                        background: 'linear-gradient(to right, #00c6ff, #0072ff)',
                        borderRadius: 999,
                        py: 1.5,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        boxShadow: '0 0 10px rgba(0,114,255,0.5)',
                        '&:hover': {
                          background: 'linear-gradient(to right, #0072ff, #00c6ff)',
                        },
                      }}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Send OTP'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}

            {step === 2 && (
              <Box>
                <TextField
                  fullWidth
                  label="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  variant="outlined"
                  sx={{ mb: 3 }}
                  InputProps={{
                    sx: {
                      color: 'white',
                      background: '#1e1e1e',
                      borderRadius: 2,
                    },
                  }}
                  InputLabelProps={{ sx: { color: '#bbb' } }}
                />
                <Button
                  fullWidth
                  onClick={verifyOtp}
                  disabled={otp.length !== 6}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(to right, #00c6ff, #0072ff)',
                    borderRadius: 999,
                    py: 1.5,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    boxShadow: '0 0 10px rgba(0,114,255,0.5)',
                    '&:hover': {
                      background: 'linear-gradient(to right, #0072ff, #00c6ff)',
                    },
                  }}
                >
                  Verify OTP
                </Button>
                <Typography
                  variant="body2"
                  sx={{ mt: 2, textAlign: 'center', color: '#00c6ff', cursor: 'pointer' }}
                  onClick={handleSendOtp}
                >
                  Resend OTP
                </Typography>
              </Box>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      required
                      value={formData.password}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        sx: {
                          color: 'white',
                          background: '#1e1e1e',
                          borderRadius: 2,
                        },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: '#bbb' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{ sx: { color: '#bbb' } }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                      Must be at least 8 characters
                    </Typography>
                  </Grid>

                  {/* <Grid item xs={12}>
                    <Button
                      component="label"
                      fullWidth
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      sx={{
                        py: 2,
                        border: '2px dashed rgba(255,255,255,0.2)',
                        borderRadius: 2,
                        color: 'white',
                        '&:hover': {
                          borderColor: '#00c6ff',
                        },
                      }}
                    >
                      {resume ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle color="success" />
                          {resume.name}
                        </Box>
                      ) : (
                        'Upload Resume (PDF)'
                      )}
                      <input
                        type="file"
                        hidden
                        accept="application/pdf"
                        onChange={handleResumeUpload}
                      />
                    </Button>
                  </Grid> */}

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      disabled={!isStep3Valid() || isSubmitting}
                      variant="contained"
                      sx={{
                        background: 'linear-gradient(to right, #00c6ff, #0072ff)',
                        borderRadius: 999,
                        py: 1.5,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        boxShadow: '0 0 10px rgba(0,114,255,0.5)',
                        '&:hover': {
                          background: 'linear-gradient(to right, #0072ff, #00c6ff)',
                        },
                      }}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Complete Registration'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}