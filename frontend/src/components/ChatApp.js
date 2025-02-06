import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Paper, Stack } from "@mui/material";
import { HistoryOutlined } from '@mui/icons-material';

function ChatApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { predicted_class, probability, imageUrl } = location.state || {};
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (predicted_class) {
      const dismessage = `What are the details about this crop disease? :- ${predicted_class}`;
      handleSend(dismessage);
    }
  }, []);

  const handleSend = async (messageToSend = message) => {
    if (!messageToSend.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userMessage = { role: "user", content: messageToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, { role: "assistant", content: "...processing..." }]);

    if (messageToSend === message) {
      setMessage("");
    }

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: messageToSend, 
          history: updatedMessages,
          disease_title: predicted_class || 'Unknown Disease'
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) throw new Error("Failed to communicate with the server");

      const data = await response.json();
      if (data.error) return;

      const assistantMessage = { role: "assistant", content: data.response };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Error:", error.message);
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: "Error: Failed to get response"
        };
        return newMessages;
      });
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Box 
      className="page-container"
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
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Leaf Disease Analysis
          </Typography>
          <Button
            variant="outlined"
            startIcon={<HistoryOutlined />}
            onClick={() => navigate('/history')}
          >
            View History
          </Button>
        </Box>

        {/* Disease Info Section */}
        {predicted_class && imageUrl && (
          <Box 
            sx={{
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              mb: 2, 
              bgcolor: '#dff7e1', 
              padding: '1rem', 
              borderRadius: '12px'
            }}
          >
            <img
              src={imageUrl}
              alt="Uploaded leaf"
              style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px' }}
            />
            <Typography variant="h6">
              Predicted Disease: {predicted_class}
            </Typography>
            <Typography variant="body1">
              Confidence: {(probability * 100).toFixed(2)}%
            </Typography>
          </Box>
        )}

        {/* Chat Section */}
        <Typography variant="h6">
          Chat with Mistral
        </Typography>

        <Box
          ref={boxRef}
          sx={{
            overflowY: 'auto', 
            maxHeight: '60vh',
            bgcolor: '#ffffff',
            padding: '1rem',
            borderRadius: '8px',
            mb: 2,
            boxShadow: 1
          }}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                mb: 1
              }}
            >
              <Box
                sx={{
                  padding: '10px',
                  borderRadius: '8px',
                  maxWidth: '75%',
                  wordWrap: 'break-word',
                  bgcolor: msg.role === "user" ? "#D3E3FC" : "#E8F5E9",
                  boxShadow: 1
                }}
              >
                <Typography variant="body1">
                  {msg.content}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            placeholder="Type your message..."
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              backgroundColor: "white",
            }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleSend()}
            disabled={!message.trim()}
          >
            Send
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default ChatApp;
