import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { LayoutDashboard, Users, FilePlus, LogOut, Settings, Bell } from 'lucide-react';
import ChatWidget from './ChatWidget';

export default function Layout() {
  const { currentUser, logout } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => { 
    if (!currentUser) navigate('/login'); 
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('client')) return 'My Dashboard';
    if (path.includes('doctor')) return 'Specialist Workspace';
    if (path.includes('admin')) return 'Admin Console';
    if (path.includes('chat')) return 'Messages';
    if (path.includes('request')) return 'Plan Request';
    return 'Helix';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Glassmorphism Sidebar */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-white/50 shadow-sm flex flex-col fixed h-full z-20 hidden md:flex transition-all duration-300">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-emerald-200 shadow-lg">
            <span className="text-white font-bold text-xl tracking-tight">H</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">Helix</span>
            <span className="text-[10px] text-emerald-600 font-bold block tracking-widest uppercase">Health OS</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {currentUser.role === 'CLIENT' && (
            <NavLink to="/client" className={({isActive}) => `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'}`}>
              <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform duration-200" />
              <span>My Plan</span>
            </NavLink>
          )}
          
          {currentUser.role === 'DOCTOR' && (
            <NavLink to="/doctor" className={({isActive}) => `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'}`}>
              <FilePlus size={20} className="group-hover:scale-110 transition-transform duration-200" />
              <span>Plan Builder</span>
            </NavLink>
          )}

          {currentUser.role === 'ADMIN' && (
            <NavLink to="/admin" className={({isActive}) => `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'}`}>
              <Users size={20} className="group-hover:scale-110 transition-transform duration-200" />
              <span>Monitoring</span>
            </NavLink>
          )}
        </nav>

        {/* User Profile Snippet */}
        <div className="p-4 m-4 bg-white/50 rounded-2xl border border-white shadow-sm backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <img src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 capitalize truncate">{currentUser.role.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-sm font-medium">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 flex flex-col h-full overflow-hidden bg-slate-50/50 relative">
         {/* Background Decoration */}
         <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-white to-transparent pointer-events-none z-0"></div>
         
         {/* Mobile Header */}
         <header className="px-8 py-5 flex justify-between items-center z-10 sticky top-0 md:relative">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight hidden md:block">{getPageTitle()}</h1>
            <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">H</div>
                <span className="font-bold text-slate-800">Helix</span>
            </div>
            <div className="flex gap-4 items-center">
                <button className="p-2 text-slate-400 hover:bg-white hover:text-emerald-600 rounded-full transition-all relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50"></span>
                </button>
                <button className="p-2 text-slate-400 hover:bg-white hover:text-emerald-600 rounded-full transition-all">
                    <Settings size={20} />
                </button>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 z-10 scrollbar-hide">
            <Outlet />
         </div>
      </main>

      <ChatWidget />
    </div>
  );
}
