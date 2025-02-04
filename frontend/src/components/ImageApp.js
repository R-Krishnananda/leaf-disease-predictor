import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  CircularProgress,
} from "@mui/material";

function ImageApp() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select an image first.");

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Error in prediction.");

      const data = await response.json();

      // Add the selectedFile to the navigation state
      navigate("/chat", { 
        state: {
          ...data,
          imageUrl: URL.createObjectURL(selectedFile)
        } 
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to predict the image.");
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: "600px",
          p: 3,
          borderRadius: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" gutterBottom>
          Image Classification
        </Typography>

        <Box sx={{ mb: 2 }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
            style={{ marginBottom: "16px" }}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={loading}
          className="upload-button"
          sx={{ width: "100%" }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Upload and Predict"}
        </Button>
      </Paper>
    </Box>
  );
}

export default ImageApp;
