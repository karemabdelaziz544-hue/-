
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHelix, Role } from '../context/HelixContext';
import { Activity } from 'lucide-react';

export default function Login() {
  const { login } = useHelix();
  const navigate = useNavigate();

  const handleLogin = (role: Role) => {
    login(role);
    if (role === 'CLIENT') navigate('/client');
    else if (role === 'DOCTOR') navigate('/doctor');
    else navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-100">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Activity size={32} />
            </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Helix 2.0</h1>
        <p className="text-slate-500 mb-8">Select a role to view the dashboard</p>

        <div className="space-y-4">
          <button onClick={() => handleLogin('CLIENT')} className="w-full p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition font-medium text-slate-700">
            Login as Client
          </button>
          <button onClick={() => handleLogin('DOCTOR')} className="w-full p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition font-medium text-slate-700">
            Login as Doctor
          </button>
          <button onClick={() => handleLogin('ADMIN')} className="w-full p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition font-medium text-slate-700">
            Login as Admin
          </button>
        </div>
      </div>
    </div>
  );
}
