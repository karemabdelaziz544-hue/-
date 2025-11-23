import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Change 1: Import DataProvider instead of HelixProvider
import { DataProvider } from './contexts/DataContext'; 
import Layout from './components/Layout';
import Login from './pages/Login';
import { ClientDashboard } from './pages/client/ClientDashboard'; // Ensure correct import path
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Register } from './pages/Register';
import { Packages } from './pages/client/Packages';
import { PlanRequestPage } from './pages/client/PlanRequest';
import { ChatPage } from './pages/ChatPage';

export default function App() {
  return (
    // Change 2: Wrap everything in DataProvider
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<Layout />}>
            <Route path="client" element={<ClientDashboard />} />
            <Route path="packages" element={<Packages />} />
            <Route path="request" element={<PlanRequestPage />} />
            <Route path="doctor" element={<DoctorDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="chat" element={<ChatPage />} />
            
            {/* Redirect root to login */}
            <Route index element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}