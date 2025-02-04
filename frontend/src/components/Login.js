import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, TextField, Stack } from '@mui/material';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/history'); // Changed from /predict to /history
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Login failed');
    }
  };

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
          maxWidth: "400px",
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
            >
              Login
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/signin')}
            >
              Don't have an account? Sign Up
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

export default Login;
