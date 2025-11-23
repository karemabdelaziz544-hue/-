
import React from 'react';
import { useHelix } from '../../context/HelixContext';
import { CheckCircle2, Circle, Utensils, Dumbbell, Droplets } from 'lucide-react';

export default function ClientDashboard() {
  const { currentUser, getPlanForUser, toggleTask, getUserProgress } = useHelix();

  if (!currentUser) return null;

  const plan = getPlanForUser(currentUser.id);
  const progress = getUserProgress(currentUser.id);

  const getIcon = (type: string) => {
    switch (type) {
      case 'MEAL': return <Utensils size={18} />;
      case 'WORKOUT': return <Dumbbell size={18} />;
      case 'HABIT': return <Droplets size={18} />;
      default: return <Circle size={18} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header & Progress Ring */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Hello, {currentUser.name}</h1>
          <p className="text-slate-500">Here is your health plan for today.</p>
        </div>
        
        {/* Progress Gamification */}
        <div className="mt-6 md:mt-0 relative flex items-center justify-center">
            <svg className="transform -rotate-90 w-32 h-32">
                <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={314} 
                    strokeDashoffset={314 - (progress / 100) * 314} 
                    className={`text-emerald-500 transition-all duration-1000 ease-out`} 
                />
            </svg>
            <span className="absolute text-2xl font-bold text-emerald-600">{progress}%</span>
        </div>
      </div>

      {/* Task List */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Daily Tasks</h2>
        
        {!plan || plan.tasks.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center text-amber-800">
            <p className="font-medium">No active plan found.</p>
            <p className="text-sm opacity-80 mt-1">Your doctor is preparing your personalized schedule. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plan.tasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => toggleTask(currentUser.id, task.id)}
                className={`group flex items-center p-5 bg-white border rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md ${task.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}
              >
                <div className={`mr-5 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 group-hover:text-emerald-400'}`}>
                    {task.completed ? <CheckCircle2 size={28} className="fill-emerald-100" /> : <Circle size={28} />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded mr-3 uppercase tracking-wider ${
                      task.type === 'MEAL' ? 'bg-orange-100 text-orange-700' : 
                      task.type === 'WORKOUT' ? 'bg-blue-100 text-blue-700' : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {task.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{task.time}</span>
                  </div>
                  <h3 className={`text-lg font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {task.title}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">{task.description}</p>
                </div>
                
                <div className="text-slate-300">
                    {getIcon(task.type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
