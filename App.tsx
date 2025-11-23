
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelixProvider } from './context/HelixContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ClientDashboard from './pages/client/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

export default function App() {
  return (
    <HelixProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            <Route path="client" element={<ClientDashboard />} />
            <Route path="doctor" element={<DoctorDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            {/* Default redirect for demo purposes */}
            <Route index element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelixProvider>
  );
}
