import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, TextField, Stack } from '@mui/material';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful');
        navigate('/login');
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed');
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
          Sign Up
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
            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              Sign Up
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
            >
              Already have an account? Login
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

export default SignIn;
