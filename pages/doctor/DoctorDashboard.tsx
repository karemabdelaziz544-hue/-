import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { PlanStatus, DailyTask } from '../../types';
import { generateTasksFromDoctorNotes } from '../../services/geminiService';
import { 
  Sparkles, Calendar, Clock, Activity, Flame, Save, 
  XCircle, Plus, Trash2, Zap, LayoutTemplate, Calculator 
} from 'lucide-react';
import { api } from '../../services/api';

export const DoctorDashboard: React.FC = () => {
  const { requests, currentUser } = useData();
  const { addToast } = useToast();
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  
  // Doctor Input State
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Planner State
  const [plannerTasks, setPlannerTasks] = useState<Record<string, Partial<DailyTask>[]>>({});
  const [activeDay, setActiveDay] = useState<number>(1);
  const [showPlanner, setShowPlanner] = useState(false);

  // Computed State
  const [totalCalories, setTotalCalories] = useState(0);

  const myPendingRequests = requests.filter(
      r => r.doctorId === currentUser?.id && (r.status === PlanStatus.PROCESSING)
  );
  
  const selectedReq = requests.find(r => r.id === selectedReqId);

  // Update calories whenever plannerTasks changes
  useEffect(() => {
    let sum = 0;
    const tasks = plannerTasks[`day-${activeDay}`] || [];
    tasks.forEach(t => sum += (t.calories || 0));
    setTotalCalories(sum);
  }, [plannerTasks, activeDay]);

  const getDateForDay = (dayOffset: number) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (dayOffset - 1));
      return date.toISOString().split('T')[0];
  };

  const handleGenerateAI = async () => {
    if (!selectedReq || !doctorNotes) return;
    setIsGenerating(true);
    addToast("AI is analyzing your notes...", 'info');
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const generated = await generateTasksFromDoctorNotes(doctorNotes, startDate, endDate.toISOString().split('T')[0]);
    
    if (Array.isArray(generated) && generated.length > 0) {
        const newPlanner: Record<string, Partial<DailyTask>[]> = {};
        generated.forEach((task: any) => {
            const dayDiff = Math.round((new Date(task.date).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1;
            const dayKey = `day-${dayDiff}`;
            if (!newPlanner[dayKey]) newPlanner[dayKey] = [];
            newPlanner[dayKey].push({
                ...task,
                calories: task.calories || 300 
            });
        });
        setPlannerTasks(newPlanner);
        setShowPlanner(true);
        addToast("Draft plan generated successfully!", 'success');
    } else {
        addToast("AI could not generate tasks. Try more details.", 'error');
    }
    setIsGenerating(false);
  };

  // --- Templates System ---
  const applyTemplate = (templateType: 'WEIGHT_LOSS' | 'MUSCLE_GAIN') => {
      const dayKey = `day-${activeDay}`;
      const templates = {
          'WEIGHT_LOSS': [
              { title: 'Oatmeal & Berries', description: '50g Oats, water, 100g blueberries', calories: 250, time: '08:00', type: 'MEAL' },
              { title: 'Grilled Chicken Salad', description: '200g Chicken, mixed greens, lemon dressing', calories: 400, time: '13:00', type: 'MEAL' },
              { title: '30m Cardio', description: 'Brisk walking or jogging', calories: 0, time: '17:00', type: 'ACTIVITY' },
          ],
          'MUSCLE_GAIN': [
              { title: 'Egg & Avocado Toast', description: '3 eggs, 2 slices whole wheat bread', calories: 500, time: '08:00', type: 'MEAL' },
              { title: 'Steak & Rice', description: '200g Lean steak, 1 cup white rice', calories: 700, time: '13:00', type: 'MEAL' },
              { title: 'Heavy Lifting', description: 'Compound exercises (Squat/Bench/Deadlift)', calories: 0, time: '18:00', type: 'ACTIVITY' },
          ]
      };

      const newTasks = templates[templateType].map(t => ({...t, date: getDateForDay(activeDay)} as Partial<DailyTask>));
      
      setPlannerTasks(prev => ({
          ...prev,
          [dayKey]: [...(prev[dayKey] || []), ...newTasks]
      }));
      addToast(`${templateType === 'WEIGHT_LOSS' ? 'Weight Loss' : 'Muscle Gain'} template applied!`, 'success');
  };

  const handleManualAdd = (type: 'MEAL' | 'ACTIVITY') => {
      const dayKey = `day-${activeDay}`;
      const newTask: Partial<DailyTask> = {
          title: type === 'MEAL' ? 'New Meal' : 'New Activity',
          description: '',
          time: '08:00',
          type,
          calories: 0,
          date: getDateForDay(activeDay)
      };
      setPlannerTasks(prev => ({
          ...prev,
          [dayKey]: [...(prev[dayKey] || []), newTask]
      }));
  };

  const handleTaskChange = (dayKey: string, index: number, field: string, value: any) => {
      const updatedList = [...(plannerTasks[dayKey] || [])];
      updatedList[index] = { ...updatedList[index], [field]: value };
      setPlannerTasks({ ...plannerTasks, [dayKey]: updatedList });
  };

  const removeTask = (dayKey: string, index: number) => {
      const updatedList = [...(plannerTasks[dayKey] || [])];
      updatedList.splice(index, 1);
      setPlannerTasks({ ...plannerTasks, [dayKey]: updatedList });
  };

  const handleSubmitDraft = async () => {
      if (!selectedReq) return;
      if (Object.keys(plannerTasks).length === 0) return addToast("Plan is empty.", 'error');

      const flatTasks: Partial<DailyTask>[] = [];
      Object.entries(plannerTasks).forEach(([dayKey, tasks]) => {
          const dayNum = parseInt(dayKey.split('-')[1]);
          const dateStr = getDateForDay(dayNum);
          tasks.forEach(t => {
              flatTasks.push({ ...t, date: dateStr });
          });
      });

      try {
          const token = localStorage.getItem('helix_token');
          if (!token) return;
          await api.submitDraftPlan(token, selectedReq.id, flatTasks);
          addToast("Plan submitted for Admin Review!", 'success');
          setSelectedReqId(null);
          setPlannerTasks({});
          setShowPlanner(false);
          setDoctorNotes('');
      } catch (e) {
          addToast("Failed to submit draft.", 'error');
      }
  };

  return (
    <div className="space-y-6 h-full flex flex-col max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <Activity className="text-emerald-600" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Doctor Workspace</h1>
            <p className="text-slate-500 text-sm">Manage patients and build diet plans</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Patient List */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Waiting List</h2>
            {myPendingRequests.length === 0 ? (
                <div className="p-8 bg-white/50 border border-dashed border-gray-300 rounded-2xl text-center">
                    <Zap className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">All caught up!</p>
                </div>
            ) : (
                <div className="space-y-3">
                {myPendingRequests.map(req => (
                    <div 
                        key={req.id}
                        onClick={() => {
                            setSelectedReqId(req.id);
                            setShowPlanner(false);
                            setPlannerTasks({});
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                            selectedReqId === req.id 
                            ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-lg border-emerald-600' 
                            : 'bg-white border-gray-100 hover:border-emerald-300 hover:shadow-md'
                        }`}
                    >
                        <div className="relative z-10 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                                selectedReqId === req.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                                {req.clientName.charAt(0)}
                            </div>
                            <div>
                                <h3 className={`font-bold ${selectedReqId === req.id ? 'text-white' : 'text-slate-800'}`}>{req.clientName}</h3>
                                <p className={`text-xs ${selectedReqId === req.id ? 'text-emerald-100' : 'text-slate-400'}`}>Goal: {req.goals.substring(0, 15)}...</p>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>

        {/* Workspace */}
        <div className="lg:col-span-9 flex flex-col h-full min-h-[600px]">
            {selectedReq ? (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full overflow-hidden relative">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 bg-white z-20">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Plan Creator</h2>
                                <p className="text-sm text-slate-500">Patient: <span className="font-semibold text-emerald-600">{selectedReq.clientName}</span></p>
                            </div>
                            <button onClick={() => setSelectedReqId(null)} className="text-slate-300 hover:text-slate-500 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        {!showPlanner && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-500">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">AI Context & Notes</label>
                                    <div className="relative">
                                        <textarea 
                                            value={doctorNotes}
                                            onChange={(e) => setDoctorNotes(e.target.value)}
                                            placeholder="E.g. Patient needs high protein, avoids dairy, 2500kcal goal..."
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl h-32 text-sm focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                        />
                                        <button
                                            onClick={handleGenerateAI}
                                            disabled={isGenerating || !doctorNotes}
                                            className="absolute bottom-4 right-4 py-2 px-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg shadow-emerald-200"
                                        >
                                            {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/> : <Sparkles size={16} />}
                                            Generate
                                        </button>
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>

                    {/* Planner UI */}
                    {showPlanner && (
                        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
                            {/* Sticky Day & Stats Bar */}
                            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {[1,2,3,4,5,6,7].map(day => (
                                        <button
                                            key={day}
                                            onClick={() => setActiveDay(day)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                                                activeDay === day 
                                                ? 'bg-slate-800 text-white shadow-lg scale-110' 
                                                : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-800'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Daily Total</p>
                                        <p className={`text-lg font-bold leading-none ${totalCalories > 2500 ? 'text-orange-500' : 'text-emerald-600'}`}>
                                            {totalCalories} <span className="text-xs text-slate-400">kcal</span>
                                        </p>
                                    </div>
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                        <Calculator size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Cards Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Quick Actions */}
                                <div className="flex flex-wrap gap-3 mb-6">
                                    <button onClick={() => applyTemplate('WEIGHT_LOSS')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                                        <LayoutTemplate size={14} className="text-blue-500"/> Load Weight Loss Template
                                    </button>
                                    <button onClick={() => applyTemplate('MUSCLE_GAIN')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                                        <LayoutTemplate size={14} className="text-purple-500"/> Load Muscle Gain Template
                                    </button>
                                    <div className="flex-1"></div>
                                    <button onClick={() => handleManualAdd('MEAL')} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-4 py-2 rounded-lg font-bold hover:bg-orange-100 flex items-center gap-2 transition-colors">
                                        <Plus size={14} /> Add Meal
                                    </button>
                                    <button onClick={() => handleManualAdd('ACTIVITY')} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-2 transition-colors">
                                        <Plus size={14} /> Add Activity
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {(plannerTasks[`day-${activeDay}`] || []).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                            <Calendar size={48} className="mb-4 opacity-50" />
                                            <p className="font-medium">Day {activeDay} is empty</p>
                                            <p className="text-sm">Use a template or add items manually.</p>
                                        </div>
                                    ) : (
                                        (plannerTasks[`day-${activeDay}`] || []).map((task, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3 items-center">
                                                        <select 
                                                            value={task.type}
                                                            onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'type', e.target.value)}
                                                            className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg border-none focus:ring-0 cursor-pointer tracking-wider ${
                                                                task.type === 'MEAL' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                            }`}
                                                        >
                                                            <option value="MEAL">MEAL</option>
                                                            <option value="ACTIVITY">ACTIVITY</option>
                                                        </select>
                                                        <div className="flex items-center text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
                                                            <Clock size={14} className="mr-2 text-slate-400"/>
                                                            <input 
                                                                type="time" 
                                                                value={task.time}
                                                                onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'time', e.target.value)}
                                                                className="bg-transparent border-none p-0 w-16 text-xs font-bold focus:ring-0 text-slate-700"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeTask(`day-${activeDay}`, idx)} className="text-slate-300 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-2 rounded-full">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex gap-6">
                                                    <div className="flex-1 space-y-2">
                                                        <input 
                                                            type="text" 
                                                            value={task.title}
                                                            onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'title', e.target.value)}
                                                            className="w-full font-bold text-slate-800 text-lg border-none p-0 focus:ring-0 placeholder-slate-300 bg-transparent"
                                                            placeholder="Task Title..."
                                                        />
                                                        <input 
                                                            type="text"
                                                            value={task.description}
                                                            onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'description', e.target.value)}
                                                            className="w-full text-sm text-slate-500 border-none p-0 focus:ring-0 placeholder-slate-300 bg-transparent"
                                                            placeholder="Add description..."
                                                        />
                                                    </div>
                                                    <div className="border-l-2 border-slate-50 pl-6 flex flex-col justify-center min-w-[80px]">
                                                        <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                                                            <Flame size={12} className={task.calories && task.calories > 500 ? "text-orange-500" : "text-slate-300"} /> Kcal
                                                        </label>
                                                        <input 
                                                            type="number"
                                                            value={task.calories}
                                                            onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'calories', parseInt(e.target.value) || 0)}
                                                            className="w-full text-2xl font-bold text-slate-700 border-none focus:ring-0 p-0 bg-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-white/90 backdrop-blur border-t border-slate-100 flex justify-between items-center absolute bottom-0 w-full z-40">
                                <button onClick={() => {setShowPlanner(false); setPlannerTasks({});}} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm">
                                    Discard Draft
                                </button>
                                <button onClick={handleSubmitDraft} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2 transform active:scale-95 transition-all">
                                    <Save size={18} /> Submit Plan for Review
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-300 shadow-sm">
                    <Activity size={64} className="mb-6 text-slate-200" />
                    <p className="font-bold text-lg text-slate-400">Ready to work</p>
                    <p className="text-sm">Select a patient from the waiting list to begin.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
