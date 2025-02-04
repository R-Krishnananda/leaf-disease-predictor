import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatApp from './components/ChatApp';
import ImageApp from './components/ImageApp';



const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/chat" element ={<ChatApp />} />
        <Route path="/predict" element={<ImageApp />} />
      </Routes>
    </Router>
  );
};

export default App;
