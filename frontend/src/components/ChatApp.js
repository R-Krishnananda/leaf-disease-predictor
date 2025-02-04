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

  // Handle incoming predicted class on component mount
  useEffect(() => {
    // Check for authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (predicted_class) {
      const dismessage = `What are the details about this crop disease? :- ${predicted_class}`;
      handleSend(dismessage);
    }
  }, []); // Run once on mount

  const handleSend = async (messageToSend = message) => {
    // Don't proceed if there's no message
    if (!messageToSend.trim()) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Append the user's message to the chat window
    const userMessage = { role: "user", content: messageToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, { role: "assistant", content: "...processing..." }]);

    // Reset the input field if it's a manual message
    if (messageToSend === message) {
      setMessage("");
    }

    try {
      // Send the updated message history to the backend
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

      if (!response.ok) {
        throw new Error("Failed to communicate with the server");
      }

      const data = await response.json();

      if (data.error) {
        console.error(data.error);
        return;
      }

      // Append the assistant's response to the chat
      const assistantMessage = { role: "assistant", content: data.response };
      const newHistory = [...updatedMessages, assistantMessage];
      setMessages(newHistory);
    } catch (error) {
      console.error("Error:", error.message);
      // Update the last message to show the error
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
    // Automatically scroll to the bottom whenever content changes
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Box className="page-container">
      <Paper elevation={3} className="content-paper">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
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

        {/* Disease Info Section - Always visible if data exists */}
        {predicted_class && imageUrl && (
          <Box className="disease-info">
            <img
              src={imageUrl}
              alt="Uploaded leaf"
              className="uploaded-image"
            />
            <Typography variant="h6" align="center" gutterBottom>
              Predicted Disease: {predicted_class}
            </Typography>
            <Typography variant="body1" align="center" gutterBottom>
              Confidence: {(probability * 100).toFixed(2)}%
            </Typography>
          </Box>
        )}

        <Typography variant="h6" gutterBottom>
          Chat with Mistral
        </Typography>

        {/* Chat Section */}
        <Box
          ref={boxRef}
          className="chat-container"
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              className={`message-box ${msg.role === "user" ? "user-message" : "assistant-message"}`}
            >
              <Typography
                align={msg.role === "user" ? "right" : "left"}
                sx={{
                  color: msg.role === "user" ? "blue" : "black",
                  mb: 1,
                  wordWrap: "break-word",
                }}
              >
                {msg.content}
              </Typography>
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