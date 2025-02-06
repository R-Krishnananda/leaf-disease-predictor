import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Collapse
} from '@mui/material';
import { HistoryOutlined, Logout, ExpandMore } from '@mui/icons-material';

function ChatHistory() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPanels, setOpenPanels] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchChats();
  }, [navigate]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const togglePanel = (index) => {
    setOpenPanels(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: '#74CF8C',
        width: '100vw',
        padding: '2rem',
        boxSizing: 'border-box'
      }}
    >
      <Paper 
        elevation={3} 
        sx={{
          backgroundColor: '#b7e9c4',
          minHeight: '100vh',
          width: '90vw',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Disease Analysis History</Typography>
          <Box>
            <Button variant="outlined" startIcon={<HistoryOutlined />} onClick={() => navigate('/predict')} sx={{ mr: 1 }}>New Analysis</Button>
            <Button variant="outlined" startIcon={<Logout />} onClick={handleLogout}>Logout</Button>
          </Box>
        </Box>

        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : chats.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6">No chat history found</Typography>
              <Button variant="contained" onClick={() => navigate('/predict')} sx={{ mt: 2 }}>Start New Analysis</Button>
            </Box>
          ) : (
            chats.map((chat, index) => (
              <Paper key={index} sx={{ mb: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => togglePanel(index)}>
                  <Typography variant="h6">{chat.disease_title || 'Unknown Disease'}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="textSecondary">{formatDate(chat.updated_at)}</Typography>
                    <ExpandMore sx={{ transform: openPanels[index] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease-in-out' }} />
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Collapse in={openPanels[index]} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2 }}>
                    {chat.messages.map((message, msgIndex) => (
                      <Box key={msgIndex} sx={{ my: 1 }}>
                        <Typography variant="body1">
                          <strong>{message.role === 'user' ? 'You: ' : 'Assistant: '}</strong>
                          {message.content}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Paper>
            ))
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default ChatHistory;
