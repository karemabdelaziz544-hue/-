import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'; 
import { DataProvider } from './contexts/DataContext'; 
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Register } from './pages/Register';
import { Packages } from './pages/client/Packages';
import { PlanRequestPage } from './pages/client/PlanRequest';
import { ChatPage } from './pages/ChatPage';

export default function App() {
  return (
    <DataProvider>
      <ToastProvider>
        <HashRouter>
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
              
              <Route index element={<Navigate to="/login" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </DataProvider>
  );
}
