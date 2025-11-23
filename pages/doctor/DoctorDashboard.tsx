import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { PlanStatus, DailyTask } from '../../types';
import { generateTasksFromDoctorNotes } from '../../services/geminiService';
import { Sparkles, Calendar, Clock, Activity, Flame, Save, XCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

export const DoctorDashboard: React.FC = () => {
  const { requests, currentUser } = useData();
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  
  // Doctor Input State
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Weekly Planner State
  // We map Day 1...Day 7 to tasks
  const [plannerTasks, setPlannerTasks] = useState<Record<string, Partial<DailyTask>[]>>({});
  const [activeDay, setActiveDay] = useState<number>(1);
  const [showPlanner, setShowPlanner] = useState(false);

  const myPendingRequests = requests.filter(
      r => r.doctorId === currentUser?.id && (r.status === PlanStatus.PROCESSING)
  );
  
  const selectedReq = requests.find(r => r.id === selectedReqId);

  // Helper to calculate date string based on start date + offset
  const getDateForDay = (dayOffset: number) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (dayOffset - 1));
      return date.toISOString().split('T')[0];
  };

  const handleGenerateAI = async () => {
    if (!selectedReq || !doctorNotes) return;
    setIsGenerating(true);
    
    // AI service returns a flat array of tasks with 'date' property
    // We need to assume the AI returns 7 days worth of tasks or specific dates
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const generated = await generateTasksFromDoctorNotes(doctorNotes, startDate, endDate.toISOString().split('T')[0]);
    
    // Fix: Ensure generated is treated as an array to avoid 'unknown' type error
    if (Array.isArray(generated) && generated.length > 0) {
        // Group by Date for the UI
        const newPlanner: Record<string, Partial<DailyTask>[]> = {};
        generated.forEach((task: any) => {
            const dayDiff = Math.round((new Date(task.date).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1;
            const dayKey = `day-${dayDiff}`;
            if (!newPlanner[dayKey]) newPlanner[dayKey] = [];
            newPlanner[dayKey].push({
                ...task,
                calories: 300 // Default placeholder if AI doesn't send it
            });
        });
        setPlannerTasks(newPlanner);
        setShowPlanner(true);
    } else {
        alert("Could not generate tasks. Please refine your notes.");
    }
    setIsGenerating(false);
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
      if (Object.keys(plannerTasks).length === 0) return alert("Plan is empty.");

      // Flatten tasks
      const flatTasks: Partial<DailyTask>[] = [];
      Object.entries(plannerTasks).forEach(([dayKey, tasks]) => {
          const dayNum = parseInt(dayKey.split('-')[1]);
          const dateStr = getDateForDay(dayNum);
          tasks.forEach(t => {
              flatTasks.push({ ...t, date: dateStr });
          });
      });

      try {
          // Retrieve token from storage for API call
          const token = localStorage.getItem('helix_token');
          if (!token) return;
          
          await api.submitDraftPlan(token, selectedReq.id, flatTasks);
          
          alert("Plan submitted for Admin Review!");
          setSelectedReqId(null);
          setPlannerTasks({});
          setShowPlanner(false);
          setDoctorNotes('');
      } catch (e) {
          console.error(e);
          alert("Failed to submit draft.");
      }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Patient List */}
        <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Patients</h2>
            {myPendingRequests.length === 0 ? (
                <div className="p-4 bg-white rounded-lg border text-center text-gray-400 text-sm">
                    No pending patients.
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
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                            selectedReqId === req.id 
                            ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                            : 'bg-white border-gray-200 hover:border-emerald-300'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                                {req.clientName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">{req.clientName}</h3>
                                <p className="text-xs text-gray-500">Goal: {req.goals.substring(0, 15)}...</p>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>

        {/* Workspace */}
        <div className="lg:col-span-9 flex flex-col h-full">
            {selectedReq ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Weekly Planner</h2>
                                <p className="text-sm text-gray-500">Creating plan for <span className="font-semibold text-emerald-700">{selectedReq.clientName}</span></p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedReqId(null)} className="text-gray-400 hover:text-gray-600">
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>
                        
                        {!showPlanner && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full mt-1 p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">AI Instructions</label>
                                    <textarea 
                                        value={doctorNotes}
                                        onChange={(e) => setDoctorNotes(e.target.value)}
                                        placeholder="E.g. High protein, no dairy, 2000 kcal..."
                                        className="w-full mt-1 p-2 border rounded-lg h-24 text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={isGenerating || !doctorNotes}
                                    className="col-span-2 py-3 bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition disabled:opacity-50"
                                >
                                    {isGenerating ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : <Sparkles size={18} />}
                                    Generate Draft Plan
                                </button>
                             </div>
                        )}
                    </div>

                    {/* Planner UI */}
                    {showPlanner && (
                        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                            {/* Day Tabs */}
                            <div className="flex overflow-x-auto bg-white border-b border-gray-200 p-2 gap-2">
                                {[1,2,3,4,5,6,7].map(day => (
                                    <button
                                        key={day}
                                        onClick={() => setActiveDay(day)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                            activeDay === day 
                                            ? 'bg-emerald-600 text-white shadow-md' 
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        Day {day} <span className="text-[10px] opacity-70 block">{getDateForDay(day)}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Cards Area */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-700">Tasks for Day {activeDay}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleManualAdd('MEAL')} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold hover:bg-orange-200 flex items-center gap-1">
                                            <Plus size={14} /> Add Meal
                                        </button>
                                        <button onClick={() => handleManualAdd('ACTIVITY')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold hover:bg-blue-200 flex items-center gap-1">
                                            <Plus size={14} /> Add Activity
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {(plannerTasks[`day-${activeDay}`] || []).length === 0 ? (
                                        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                                            No tasks for this day. Add some!
                                        </div>
                                    ) : (
                                        (plannerTasks[`day-${activeDay}`] || []).map((task, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 group">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-2">
                                                        <select 
                                                            value={task.type}
                                                            onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'type', e.target.value)}
                                                            className={`text-xs font-bold uppercase px-2 py-1 rounded border-none focus:ring-0 ${
                                                                task.type === 'MEAL' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                                            }`}
                                                        >
                                                            <option value="MEAL">MEAL</option>
                                                            <option value="ACTIVITY">ACTIVITY</option>
                                                        </select>
                                                        <div className="flex items-center text-gray-400 text-xs bg-gray-50 px-2 rounded">
                                                            <Clock size={12} className="mr-1"/>
                                                            <input 
                                                                type="time" 
                                                                value={task.time}
                                                                onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'time', e.target.value)}
                                                                className="bg-transparent border-none p-0 w-16 focus:ring-0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeTask(`day-${activeDay}`, idx)} className="text-gray-300 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="md:col-span-3">
                                                        <input 
                                                            type="text" 
                                                            value={task.title}
                                                            onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'title', e.target.value)}
                                                            className="w-full font-bold text-gray-800 border-b border-transparent hover:border-gray-200 focus:border-emerald-500 focus:outline-none mb-1"
                                                            placeholder="Title (e.g. Oatmeal)"
                                                        />
                                                        <textarea 
                                                            value={task.description}
                                                            onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'description', e.target.value)}
                                                            className="w-full text-sm text-gray-500 border-none resize-none focus:ring-0 bg-transparent"
                                                            placeholder="Description..."
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div className="border-l border-gray-100 pl-4 flex flex-col justify-center">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                                                            <Flame size={10} /> Calories
                                                        </label>
                                                        <input 
                                                            type="number"
                                                            value={task.calories}
                                                            onChange={(e) => handleTaskChange(`day-${activeDay}`, idx, 'calories', parseInt(e.target.value))}
                                                            className="w-full text-lg font-bold text-emerald-600 border-none focus:ring-0 p-0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3">
                                <button onClick={() => {setShowPlanner(false); setPlannerTasks({});}} className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">
                                    Discard
                                </button>
                                <button onClick={handleSubmitDraft} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg flex items-center gap-2">
                                    <Save size={18} /> Submit for Review
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                    <Activity size={48} className="mb-4 opacity-20" />
                    <p className="font-medium">Select a patient to start planning</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};