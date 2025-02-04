import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LogoutIcon from '@mui/icons-material/Logout';

function ChatHistory() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchChats();
  }, []);

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

  return (
    <Box className="page-container full-width-height" bgcolor={"#74CF8C"}>
      <AppBar position="static" className="app-header">
        <Toolbar color={"#74CF8C"}>   
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} bgcolor={"#74CF8C"}>
            Disease Analysis History
          </Typography>
          <Button
            color="inherit"
            startIcon={<CloudUploadIcon />}
            onClick={() => navigate('/predict')}
            className="header-button"
          >
            New Analysis
          </Button>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box className="content-paper full-width-height">
        <Paper elevation={3}>
          {loading ? (
            <Box className="loading-container">
              <CircularProgress />
            </Box>
          ) : chats.length === 0 ? (
            <Box className="no-history-container">
              <Typography variant="h6" gutterBottom>
                No chat history found
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={() => navigate('/predict')}
                className="action-button"
              >
                Start New Analysis
              </Button>
            </Box>
          ) : (
            chats.map((chat, index) => (
              <Accordion key={index} className="history-accordion">
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box className="history-header">
                    <Typography variant="h6">
                      Disease: {chat.disease_title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Last Updated: {formatDate(chat.updated_at)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Divider className="action-button" />
                  {chat.messages.map((message, msgIndex) => (
                    <Box
                      key={msgIndex}
                      className={`message-box ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                    >
                      <Typography
                        variant="body2"
                        className={`message-content ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                      >
                        {message.role === 'user' ? 'You' : 'Assistant'}: {message.content}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default ChatHistory;
