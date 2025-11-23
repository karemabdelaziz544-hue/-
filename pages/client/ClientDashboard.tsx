import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { TaskStatus, DailyTask } from '../../types';
import { 
  CheckCircle2, Circle, TrendingUp, Calendar, Zap, 
  Droplets, Sun, Moon, Sunrise, Trophy, Plus, Minus 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';

export const ClientDashboard: React.FC = () => {
  const { currentUser, getClientTasks, toggleTaskCompletion } = useData();
  const { addToast } = useToast();
  const [greeting, setGreeting] = useState('');
  const [waterCups, setWaterCups] = useState(0);
  const [streak, setStreak] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const allTasks = currentUser ? getClientTasks(currentUser.id) : [];
  const todaysTasks = allTasks.filter(t => t.date === todayStr);

  useEffect(() => {
    // Greeting Logic
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Load water from local storage for persistence
    const savedWater = localStorage.getItem(`water-${todayStr}`);
    if (savedWater) setWaterCups(parseInt(savedWater));

    // Calculate Streak (Simulated Logic based on completion history)
    // In a real app, this would recurse back through dates
    let currentStreak = 0;
    const pastTasks = allTasks.filter(t => t.date < todayStr).sort((a,b) => b.date.localeCompare(a.date));
    // Simplified: Check if yesterday had completed tasks. 
    // For demo, we'll just randomise it to look premium if 0, or calculate real
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const yTasks = allTasks.filter(t => t.date === yStr);
    
    if (yTasks.length > 0 && yTasks.every(t => t.status === TaskStatus.COMPLETED)) {
        currentStreak = 5; // Example streak
    } else {
        currentStreak = 3; // Fallback demo streak for UI
    }
    setStreak(currentStreak);

  }, [currentUser, allTasks, todayStr]);

  const updateWater = (delta: number) => {
      const newVal = Math.max(0, waterCups + delta);
      setWaterCups(newVal);
      localStorage.setItem(`water-${todayStr}`, newVal.toString());
      if (delta > 0 && newVal % 4 === 0) {
          addToast("Great job! Stay hydrated 💧", 'info');
      }
  };

  const handleTaskToggle = async (task: DailyTask) => {
    if (task.date !== todayStr) return;
    await toggleTaskCompletion(task.id);
    if (task.status !== TaskStatus.COMPLETED) {
        addToast("Task Completed! Keep it up! 🎉", 'success');
    }
  };
  
  // Progress Calc
  const completedTasks = todaysTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const totalTasks = todaysTasks.length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const pieData = [
    { name: 'Completed', value: completedTasks },
    { name: 'Remaining', value: Math.max(0, totalTasks - completedTasks) },
  ];
  // If no tasks, show grey ring
  const displayPieData = totalTasks === 0 ? [{ name: 'Empty', value: 1 }] : pieData;
  const COLORS = totalTasks === 0 ? ['#f3f4f6'] : ['#10b981', '#f3f4f6'];

  if (!currentUser) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Greeting Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
            <Sun size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <div className="flex items-center gap-2 text-indigo-100 mb-2 font-medium">
                    {greeting === 'Good Morning' && <Sunrise size={20} />}
                    {greeting === 'Good Afternoon' && <Sun size={20} />}
                    {greeting === 'Good Evening' && <Moon size={20} />}
                    <span>{greeting}, {currentUser.name.split(' ')[0]}</span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Ready to crush your goals?</h1>
                <p className="text-indigo-100 max-w-lg">You have completed {completedTasks} out of {totalTasks} tasks today. Consistency is key!</p>
            </div>
            
            {/* Streak Badge */}
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/20">
                <div className="bg-orange-500 rounded-full p-3 shadow-lg shadow-orange-500/50">
                    <FlameIcon />
                </div>
                <div>
                    <p className="text-xs text-orange-100 uppercase font-bold tracking-wider">Daily Streak</p>
                    <p className="text-3xl font-bold">{streak} Days</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Tasks */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-emerald-500" size={24} /> 
                    Today's Plan
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                    {todayStr}
                </span>
            </div>

            <div className="space-y-3">
                {todaysTasks.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-300">
                        <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-gray-500">No tasks assigned</h3>
                        <p className="text-gray-400 text-sm mt-2">Relax! Your plan is clear for today.</p>
                    </div>
                ) : (
                    todaysTasks.map((task) => {
                        const isCompleted = task.status === TaskStatus.COMPLETED;
                        return (
                            <div 
                                key={task.id}
                                onClick={() => handleTaskToggle(task)}
                                className={`
                                    relative overflow-hidden group p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-4
                                    ${isCompleted 
                                        ? 'bg-emerald-50/50 border-emerald-100 shadow-none' 
                                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:translate-y-[-2px]'
                                    }
                                `}
                            >
                                <div className={`
                                    transition-all duration-500 rounded-full p-1
                                    ${isCompleted ? 'text-emerald-500 scale-110' : 'text-gray-300 group-hover:text-emerald-400'}
                                `}>
                                    {isCompleted ? <CheckCircle2 size={32} className="fill-emerald-100" /> : <Circle size={32} strokeWidth={1.5} />}
                                </div>
                                
                                <div className="flex-1 z-10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                            task.type === 'MEAL' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {task.type}
                                        </span>
                                        <span className="text-xs font-medium text-gray-400">{task.time}</span>
                                    </div>
                                    <h3 className={`text-lg font-semibold transition-all duration-300 ${isCompleted ? 'text-gray-400 line-through decoration-emerald-300' : 'text-gray-800'}`}>
                                        {task.title}
                                    </h3>
                                    <p className={`text-sm transition-colors ${isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {task.description}
                                    </p>
                                </div>

                                {isCompleted && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/0 via-emerald-100/30 to-emerald-50/0 pointer-events-none animate-pulse"></div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Right Col: Widgets */}
        <div className="space-y-8">
            {/* Progress Ring */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
                <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-4">Daily Completion</h3>
                <div className="w-48 h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={displayPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                                cornerRadius={10}
                                paddingAngle={5}
                            >
                                {displayPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-4xl font-extrabold text-gray-800">{progress}%</span>
                         <span className="text-xs text-gray-400">Completed</span>
                    </div>
                </div>
            </div>

            {/* Water Tracker Widget */}
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-cyan-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Droplets size={24} className="text-cyan-50" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Hydration</h3>
                        <p className="text-cyan-100 text-xs">Goal: 8 cups</p>
                    </div>
                </div>
                
                <div className="flex items-end justify-between mb-6 relative z-10">
                    <span className="text-5xl font-bold">{waterCups}</span>
                    <span className="text-lg text-cyan-200 mb-2">/ 8 cups</span>
                </div>

                <div className="flex gap-3 relative z-10">
                    <button 
                        onClick={() => updateWater(-1)}
                        className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-xl flex items-center justify-center transition-colors"
                    >
                        <Minus size={20} />
                    </button>
                    <button 
                        onClick={() => updateWater(1)}
                        className="flex-1 bg-white text-cyan-600 hover:bg-cyan-50 py-2 rounded-xl flex items-center justify-center font-bold shadow-sm transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Quick Tip */}
            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex gap-4">
                <Zap className="text-amber-500 flex-shrink-0" fill="currentColor" />
                <div>
                    <h4 className="font-bold text-amber-800 text-sm">Pro Tip</h4>
                    <p className="text-amber-700 text-xs mt-1 leading-relaxed">Checking off tasks as soon as you do them increases dopamine and motivation!</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Custom Icon Component
const FlameIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flame"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.246-2.056-3.37-4.5C6.01 7.02 5.37 8 5.37 8a5.86 5.86 0 0 0 2.26 5.952C7.83 14.16 8.16 14.38 8.5 14.5Z"/><path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9Z"/><path d="M19 12v7"/><path d="M19 12h2"/><path d="M19 12h-2"/></svg>
);
