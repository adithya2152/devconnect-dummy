import React from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Stack,
  Link,
  IconButton
} from '@mui/material';
import { Code, Group, RocketLaunch, Chat } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/nav';

const features = [
  {
    title: 'Connect with Developers',
    description: 'Find like-minded coders, open source contributors, and collaborators instantly.',
    icon: <Group fontSize="large" />,
  },
  {
    title: 'Showcase Your Work',
    description: 'Sync your GitHub, LinkedIn, and StackOverflow to build your tech profile.',
    icon: <Code fontSize="large" />,
  },
  {
    title: 'Launch Ideas Together',
    description: 'Create teams, join projects, and turn ideas into production-ready apps.',
    icon: <RocketLaunch fontSize="large" />,
  },
  {
    title: 'Real-time Collaboration',
    description: 'Chat with team members, share ideas, and coordinate project development.',
    icon: <Chat fontSize="large" />,
  },
];

export default function DevConnectLandingPage() {
    const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Navigation */}
      <NavBar />

      {/* HERO */}
      <Box
        sx={{
          py: { xs: 12, md: 18 },
          px: 2,
          textAlign: 'center',
          mt: 8, // Account for fixed navigation
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={700} gutterBottom>
            DevConnect
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.7)" mb={4}>
            Your developer network. Collaborate. Build. Ship. 🚀
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{
                background: 'linear-gradient(90deg, #00c6ff, #0072ff)',
                borderRadius: 999,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: '0 0 20px rgba(0,114,255,0.4)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #0072ff, #00c6ff)',
                },
              }}
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: 'white',
                borderColor: 'white',
                borderRadius: 999,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
              onClick={() => navigate('/chat')}
            >
              Try Chat
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* FEATURES */}
      <Container sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {features.map((feature, idx) => (
            <Grid item xs={12} md={6} lg={3} key={idx}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  borderRadius: 4,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  },
                }}
              >
                <CardContent>
                  <Box mb={2}>{feature.icon}</Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CALL TO ACTION */}
      <Box sx={{ py: 10, textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Ready to connect and build?
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.7)" mb={3}>
            Join the platform where developers meet, collaborate, and ship ideas faster.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: 'white',
                borderColor: 'white',
                borderRadius: 999,
                px: 4,
                py: 1.2,
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
              onClick={()=>navigate('/projects')}
            >
              Explore Projects
            </Button>
            <Button
              variant="contained"
              size="large"
              sx={{
                background: 'linear-gradient(90deg, #00c6ff, #0072ff)',
                borderRadius: 999,
                px: 4,
                py: 1.2,
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(90deg, #0072ff, #00c6ff)',
                },
              }}
              onClick={() => navigate('/chat')}
            >
              Start Chatting
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ py: 6, px: 2, background: '#111a22', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                DevConnect
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.6)">
                A platform for developers to connect, collaborate, and build the future of tech together.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Links
              </Typography>
              <Stack spacing={1}>
                <Link href="#" color="inherit" underline="hover">Home</Link>
                <Link href="#" color="inherit" underline="hover">Projects</Link>
                <Link href="#" color="inherit" underline="hover">Chat</Link>
                <Link href="#" color="inherit" underline="hover">Support</Link>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Connect With Us
              </Typography>
              <Stack direction="row" spacing={2}>
                <IconButton sx={{ color: 'white' }}><i className="fab fa-github"></i></IconButton>
                <IconButton sx={{ color: 'white' }}><i className="fab fa-linkedin"></i></IconButton>
                <IconButton sx={{ color: 'white' }}><i className="fab fa-twitter"></i></IconButton>
              </Stack>
            </Grid>
          </Grid>
          <Box mt={4} textAlign="center" color="rgba(255,255,255,0.4)">
            © {new Date().getFullYear()} DevConnect. All rights reserved.
          </Box>
        </Container>
      </Box>
    </Box>
  );
}