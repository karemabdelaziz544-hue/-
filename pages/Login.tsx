import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext'; // لاحظ: نستخدم useData الجديد
import { UserRole } from '../types';
import { Activity, Loader } from 'lucide-react';

export default function Login() {
  const { login, isLoading } = useData(); // استخدام الهوك الجديد
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleDemoLogin = async (role: string) => {
    setError('');
    let email = '';
    const password = 'password'; 

    if (role === 'CLIENT') email = 'alice@example.com';
    else if (role === 'DOCTOR') email = 'doctor@helix.com';
    else if (role === 'ADMIN') email = 'admin@helix.com';

    const success = await login(email, role as UserRole);
    
    if (success) {
      if (role === 'CLIENT') navigate('/client');
      else if (role === 'DOCTOR') navigate('/doctor');
      else navigate('/admin');
    } else {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-100">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Activity size={32} />
            </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Helix 2.0</h1>
        <p className="text-slate-500 mb-8">Select a demo role to enter</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          <button 
            onClick={() => handleDemoLogin('CLIENT')} 
            disabled={isLoading}
            className="w-full p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition font-medium text-slate-700 flex justify-center items-center gap-2"
          >
            {isLoading ? <Loader className="animate-spin" size={20}/> : 'Login as Client (Demo)'}
          </button>
          
          <button 
            onClick={() => handleDemoLogin('DOCTOR')} 
            disabled={isLoading}
            className="w-full p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition font-medium text-slate-700 flex justify-center items-center gap-2"
          >
             Login as Doctor (Demo)
          </button>
          
          <button 
            onClick={() => handleDemoLogin('ADMIN')} 
            disabled={isLoading}
            className="w-full p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition font-medium text-slate-700 flex justify-center items-center gap-2"
          >
             Login as Admin (Demo)
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-400">New user?</p>
            <Link to="/register" className="text-emerald-600 font-bold hover:underline">Create Client Account</Link>
        </div>
      </div>
    </div>
  );
}