import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from './Components/AdminLayout';
import HomePage from './Components/HomePage';
import UserLogin from './Components/UserLogin';
import PendingApproval from './Components/PendingApproval';
import UserDashboard from './Components/UserDashboard';


import AdminDashboardContent from './Components/AdminDashboardContent';
import AdminLogIn from './Components/AdminLogin';
import AdminSignup from './Components/AdminSignup';

import AdminSettings from './Components/AdminSettings';
import AdminAddUser from './Components/AdminAddUser';


import AdminSellers from './Components/AdminSellers';
import AdminRejected from './Components/AdminRejected';
import AdminPending from './Components/AdminPending';
import AdminNotifications from './Components/AdminNotifications';
import AdminHelp from './Components/AdminHelp';


import './App.css';

function AppContent() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      time += 0.005;
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `rgba(0, 40, 80, ${0.9 + Math.sin(time) * 0.1})`);
      gradient.addColorStop(0.3, `rgba(20, 60, 100, ${0.7 + Math.cos(time * 0.8) * 0.1})`);
      gradient.addColorStop(0.6, `rgba(80, 40, 100, ${0.6 + Math.sin(time * 1.2) * 0.1})`);
      gradient.addColorStop(1, `rgba(0, 60, 80, ${0.8 + Math.cos(time * 0.7) * 0.1})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawOrb = (x, y, radius, color, opacity) => {
        const orbGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        orbGradient.addColorStop(0, `${color}, ${opacity})`);
        orbGradient.addColorStop(0.5, `${color}, ${opacity * 0.4})`);
        orbGradient.addColorStop(1, `${color}, 0)`);
        
        ctx.fillStyle = orbGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      };

      drawOrb(
        canvas.width * 0.15 + Math.sin(time) * 100,
        canvas.height * 0.3 + Math.cos(time * 0.8) * 80,
        250,
        'rgba(0, 150, 255',
        0.6
      );

      drawOrb(
        canvas.width * 0.85 + Math.cos(time * 0.9) * 120,
        canvas.height * 0.7 + Math.sin(time * 1.1) * 90,
        300,
        'rgba(150, 50, 255',
        0.5
      );

      drawOrb(
        canvas.width * 0.5 + Math.sin(time * 1.3) * 60,
        canvas.height * 0.5 + Math.cos(time * 0.6) * 60,
        200,
        'rgba(255, 100, 150',
        0.4
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <Routes>
        {/* Home Route */}
        <Route path="/" element={<HomePage />} />
       
        {/* Authentication Routes */}
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/admin-login" element={<AdminLogIn />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        {/* User Routes */}
        
        <Route path="/user-dashboard" element={<UserDashboard />} />
       
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardContent />} />
          <Route path="add-user" element={<AdminAddUser />} />

          <Route path="sellers" element={<AdminSellers />} />
          <Route path="settings" element={<AdminSettings />} />

          <Route path="help" element={<AdminHelp />} />
          <Route path="pending" element={<AdminPending />} />

          <Route path="declined" element={<AdminRejected />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

      
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

// Main App export
function App() {
  return <AppContent />;
}

export default App;