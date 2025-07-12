// components/chat/ChatWidget.jsx
import React, { useState } from 'react';
import { Box, Fab, Drawer } from '@mui/material';
import ChatPage from '../../pages/ChatPage';
import ChatIcon from '@mui/icons-material/Chat';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1300,
          background: 'linear-gradient(135deg, #646cff, #535bf2)',
        }}
      >
        <ChatIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: '400px' } } }}
      >
        <ChatPage />
      </Drawer>
    </>
  );
};

export default ChatWidget;
