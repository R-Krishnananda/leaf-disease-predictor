import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, TextField, Button, Typography, Paper, Stack } from "@mui/material";

function ChatApp() {
  const location = useLocation();
  const { predicted_class, probability } = location.state || {};
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [predictedClass, setPredictedClass] = useState(predicted_class);
  const [predictedProbability, setPredictedProbability] = useState(probability);
  const boxRef = useRef(null);

  // Handle incoming predicted class on component mount
  useEffect(() => {
    if (predictedClass) {
      const dismessage=`What are the details about this crop disease? :- ${predictedClass}`;
      handleSend(dismessage);
    }
  }, []); // Run once on mount

  const handleSend = async (messageToSend = message) => {
    // Don't proceed if there's no message
    if (!messageToSend.trim()) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend, 
          history: updatedMessages 
        }),
      });

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

      // Reset predicted class and probability after processing
      if (predictedClass) {
        setPredictedClass(null);
        setPredictedProbability(null);
      }
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
    <Box
      sx={{
        backgroundColor: "#74CF8C",
        minHeight: "90vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          backgroundColor: "#D8F3DF",
          width: "100%",
          maxWidth: "920px",
          p: 3,
          borderRadius: 2,
          minHeight: "420px"
        }}
      >
        <Typography variant="h5" gutterBottom>
          Chat with Mistral
        </Typography>

        <Box
          ref={boxRef}
          sx={{
            backgroundColor: "white",
            maxHeight: "350px",
            overflowY: "auto",
            p: 1,
            mb: 2,
            border: "1px solid #ddd",
            borderRadius: 2,
            scrollBehavior: "smooth",
          }}
        >
          {messages.map((msg, index) => (
            <Typography
              key={index}
              align={msg.role === "user" ? "right" : "left"}
              sx={{
                color: msg.role === "user" ? "blue" : "black",
                mb: 1,
                wordWrap: "break-word",
              }}
            >
              {msg.content}
            </Typography>
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