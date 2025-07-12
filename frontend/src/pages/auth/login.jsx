import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Grid
} from '@mui/material';
import axios from 'axios';

const Login= () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    console.log('Logging in with:', credentials);
    // 🔗 Connect to backend here
    try {
      const res = await axios.post("http://localhost:8000/login",
        {
          email: credentials.email,
          password: credentials.password,
        }
      );
      console.log('Login response:', res.data);
      if (res.data.status === 'success') {
        // Store tokens in localStorage
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        console.log('User logged in successfully:', res.data.user);
        window.location.href = '/dashboard';
      } else {
        setError(res.data.message || 'Login failed. Please try again.');
      }
      
    } catch (error) {
      
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 5,
            borderRadius: 4,
            backgroundColor: '#121212',
            color: 'white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <Typography variant="h4" fontWeight="bold" mb={3} textAlign="center">
            Welcome Back
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  fullWidth
                  required
                  value={credentials.email}
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
                  name="password"
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  value={credentials.password}
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
              <Grid item xs={12} display="flex" justifyContent="flex-end">
                <Link href="#" underline="hover" sx={{ color: '#00c6ff', fontSize: '0.9rem' }}>
                  Forgot password?
                </Link>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(to right, #00c6ff, #0072ff)',
                      borderRadius: 999,
                      px: 4,
                      py: 1.3,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      boxShadow: '0 0 10px rgba(0,114,255,0.5)',
                      '&:hover': {
                        background: 'linear-gradient(to right, #0072ff, #00c6ff)',
                      },
                    }}
                  >
                    Login
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{ mt: 2, color: 'rgba(255,255,255,0.7)' }}
                >
                  Don’t have an account?{' '}
                  <Link
                    href="/register"
                    sx={{
                      color: '#00c6ff',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Register
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
