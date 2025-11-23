import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { TaskStatus, PlanStatus, ProgressStats } from '../../types';
import { CheckCircle, Circle, TrendingUp, Calendar, RefreshCw, MessageSquare, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, CartesianGrid, Tooltip as ReTooltip 
} from 'recharts';

export const ClientDashboard: React.FC = () => {
  const { currentUser, getClientTasks, requests, toggleTaskCompletion, getClientStats } = useData();
  const [stats, setStats] = useState<ProgressStats[]>([]);
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
  const [filterDate, setFilterDate] = useState<string>(''); // For history filter
  const navigate = useNavigate();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const allTasks = currentUser ? getClientTasks(currentUser.id) : [];
  const todaysTasks = allTasks.filter(t => t.date === todayStr);
  
  // Filtered tasks for history view
  const historyTasks = allTasks
    .filter(t => filterDate ? t.date === filterDate : true)
    .sort((a,b) => b.date.localeCompare(a.date)); // Newest first
  
  const activeRequest = currentUser ? requests.find(r => r.clientId === currentUser.id) : null;

  useEffect(() => {
    if (currentUser) {
      getClientStats(currentUser.id, viewMode === 'history' ? 'month' : 'week').then(setStats);
    }
  }, [currentUser, allTasks, viewMode]); 
  
  if (!currentUser) return null;
  
  // Calculate Progress for Today
  const completedTasks = todaysTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const totalTasks = todaysTasks.length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const pieData = [
    { name: 'Completed', value: completedTasks },
    { name: 'Remaining', value: totalTasks - completedTasks },
  ];
  const COLORS = ['#10b981', '#f3f4f6'];

  const handleContactDoctor = () => {
      if (activeRequest?.doctorId) {
          navigate(`/chat?userId=${activeRequest.doctorId}`);
      } else {
          navigate('/chat'); // Fallback
      }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {currentUser.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-1">Here's your health journey update.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setViewMode('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${viewMode === 'today' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
                Today
            </button>
            <button 
                onClick={() => setViewMode('history')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${viewMode === 'history' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
                History
            </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center relative overflow-hidden">
          <div className="flex-1 z-10">
            <p className="text-sm font-medium text-gray-500">Today's Compliance</p>
            <h3 className="text-4xl font-bold text-gray-900 mt-2">{progress}%</h3>
            <p className="text-xs text-emerald-600 mt-2 flex items-center font-medium">
              <TrendingUp size={14} className="mr-1" /> {completedTasks} of {totalTasks} tasks
            </p>
          </div>
          <div className="w-28 h-28 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={35}
                  outerRadius={45}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
             <p className="text-sm font-medium text-gray-500">{viewMode === 'history' ? 'Last 30 Days Activity' : 'Weekly Progress'}</p>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} dy={10} />
                <ReTooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                />
                <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} barSize={viewMode === 'history' ? 10 : 30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task View */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {viewMode === 'today' ? "Today's Plan" : "Task History"}
            </h2>
            
            {viewMode === 'today' ? (
                <span className="text-xs font-medium bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">
                {todayStr}
                </span>
            ) : (
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
            )}
          </div>
          
          <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
             {(viewMode === 'today' ? todaysTasks : historyTasks).length === 0 ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                  <Calendar className="h-12 w-12 text-gray-200 mb-3" />
                  <p className="font-medium">No tasks found for this period.</p>
                  {viewMode === 'today' && <p className="text-sm mt-1">Your doctor hasn't assigned a plan for today yet.</p>}
                </div>
             ) : (
                (viewMode === 'today' ? todaysTasks : historyTasks).map(task => {
                    const isPast = task.date !== todayStr;
                    return (
                        <div 
                          key={task.id} 
                          className={`p-5 flex items-start transition-all group ${
                              isPast ? 'bg-gray-50/50' : 'hover:bg-gray-50'
                          } ${task.status === TaskStatus.COMPLETED ? 'opacity-75' : ''}`}
                        >
                            {/* Checkbox - Disabled if not today */}
                          <button 
                            onClick={() => !isPast && toggleTaskCompletion(task.id)}
                            disabled={isPast}
                            className={`mt-0.5 mr-4 flex-shrink-0 transition-colors ${
                                isPast 
                                ? 'cursor-not-allowed text-gray-200' 
                                : (task.status === TaskStatus.COMPLETED ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-400')
                            }`}
                            title={isPast ? "Cannot edit past tasks" : "Toggle completion"}
                          >
                            {task.status === TaskStatus.COMPLETED ? <CheckCircle size={22} /> : <Circle size={22} />}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium text-base ${task.status === TaskStatus.COMPLETED ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {task.title}
                              </span>
                              <div className="flex gap-2">
                                {viewMode === 'history' && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{task.date}</span>}
                                {task.time && <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{task.time}</span>}
                              </div>
                            </div>
                            <p className={`text-sm mt-1 ${task.status === TaskStatus.COMPLETED ? 'text-gray-300' : 'text-gray-500'}`}>{task.description}</p>
                          </div>
                        </div>
                    );
                })
             )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
               <h3 className="font-bold text-lg mb-1 relative z-10">Current Goal</h3>
               <div className="w-12 h-1 bg-white/20 rounded mb-4 relative z-10"></div>
               {activeRequest ? (
                 <div className="relative z-10">
                    <p className="text-emerald-100 text-sm italic mb-4">"{activeRequest.goals}"</p>
                    <div className="flex items-center text-xs font-medium bg-white/10 rounded-lg p-2 w-fit mb-3">
                       <RefreshCw size={14} className="mr-2" />
                       Status: {activeRequest.status}
                    </div>
                    {activeRequest.doctorName && (
                        <div className="mb-4">
                             <p className="text-xs text-emerald-200 uppercase font-bold">Assigned Specialist</p>
                             <p className="text-sm font-medium">Dr. {activeRequest.doctorName}</p>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleContactDoctor}
                        className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <MessageSquare size={16} />
                        Contact Doctor
                    </button>
                 </div>
               ) : (
                 <div className="relative z-10">
                    <p className="text-emerald-100 text-sm mb-4">You don't have an active goal set. Start your journey today.</p>
                    <Link to="/request" className="block w-full text-center bg-white text-emerald-700 py-2 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors">
                        Set Goal
                    </Link>
                 </div>
               )}
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                <AlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Reminders</h4>
                    <p className="text-xs text-blue-700 mt-1">Drink water regularly and try to complete tasks before 8 PM for better tracking.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};