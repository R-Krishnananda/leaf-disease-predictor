import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';

function Home() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        backgroundColor: "#74CF8C",
        minHeight: "100vh",
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
          p: 4,
          borderRadius: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="h3" gutterBottom>
          Leaf Disease Predictor
        </Typography>
        <Typography variant="h6" sx={{ mb: 4 }}>
          Identify and analyze plant diseases using AI
        </Typography>
        
        <Stack spacing={2}>
          <Button 
            variant="contained" 
            color="primary"
            size="large"
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            size="large"
            onClick={() => navigate('/signin')}
          >
            Sign Up
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            size="large"
            onClick={() => navigate('/predict')}
          >
            Try Demo
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default Home;
