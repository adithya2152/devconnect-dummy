// components/chat/InlineChatBox.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Paper, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const dummyMessages = [
  { sender: 'You', content: 'Hey there!', time: '10:00 AM' },
  { sender: 'Bot', content: 'Hello! How can I help?', time: '10:01 AM' }
];

const marshGreen = '#0e6672ff';

const InlineChatBox = () => {
  const [messages, setMessages] = useState(dummyMessages);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { sender: 'You', content: input, time: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 380,
        maxHeight: '65vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        zIndex: 1300,
        bgcolor: '#000', // Black background
        border: `2px solid ${marshGreen}`
      }}
    >
      {/* Top Bar */}
      <Box sx={{ p: 1.5, bgcolor: '#000', borderBottom: `1px solid ${marshGreen}` }}>
        <Typography variant="subtitle1" fontWeight="bold" color={marshGreen}>
          DevConnect Chat
        </Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.map((msg, i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ color: marshGreen }}
            >
              {msg.sender}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              {msg.content}
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
              {msg.time}
            </Typography>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>

      {/* Input Box */}
      <Box sx={{ display: 'flex', p: 1, borderTop: `1px solid ${marshGreen}` }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          sx={{
            input: { color: 'white' },
            bgcolor: '#111',
            borderRadius: 2,
          }}
        />
        <IconButton onClick={handleSend} sx={{ color: marshGreen }}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default InlineChatBox;
