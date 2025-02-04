import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatApp from './components/ChatApp';
import ImageApp from './components/ImageApp';
import Home from './components/Home';
import Login from './components/Login';
import SignIn from './components/SignIn';
import ChatHistory from './components/ChatHistory';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/chat" element={<ChatApp />} />
        <Route path="/predict" element={<ImageApp />} />
        <Route path="/history" element={<ChatHistory />} />
      </Routes>
    </Router>
  );
};

export default App;
