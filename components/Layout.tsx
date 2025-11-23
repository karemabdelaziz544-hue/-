import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext'; // تصحيح المسار
import { LayoutDashboard, Users, FilePlus, LogOut } from 'lucide-react';
import ChatWidget from './ChatWidget';

export default function Layout() {
  const { currentUser, logout } = useData(); // استخدام useData بدلاً من useHelix
  const navigate = useNavigate();

  React.useEffect(() => { 
    if (!currentUser) navigate('/login'); 
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6 flex items-center space-x-2 border-b border-slate-100">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <span className="text-xl font-bold text-slate-800">Helix</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {currentUser.role === 'CLIENT' && (
            <NavLink to="/client" className={({isActive}) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <LayoutDashboard size={20} />
              <span className="font-medium">My Plan</span>
            </NavLink>
          )}
          
          {currentUser.role === 'DOCTOR' && (
            <NavLink to="/doctor" className={({isActive}) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <FilePlus size={20} />
              <span className="font-medium">Plan Builder</span>
            </NavLink>
          )}

          {currentUser.role === 'ADMIN' && (
            <NavLink to="/admin" className={({isActive}) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Users size={20} />
              <span className="font-medium">Monitoring</span>
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <img src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`} alt="User" className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{currentUser.name}</p>
              <p className="text-xs text-slate-500 capitalize">{currentUser.role.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto h-full">
        <Outlet />
      </main>

      <ChatWidget />
    </div>
  );
}