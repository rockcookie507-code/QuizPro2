import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard';
import { QuizEditor } from './pages/QuizEditor';
import { QuizPlayer } from './pages/QuizPlayer';
import { Analytics } from './pages/Analytics';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/quiz/:id" element={<QuizPlayer />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/quiz/:id" element={<QuizEditor />} />
        <Route path="/admin/quiz/:id/results" element={<Analytics />} />
        
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;