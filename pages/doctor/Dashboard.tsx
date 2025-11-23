
import React, { useState } from 'react';
import { useHelix, Task, TaskType } from '../../context/HelixContext';
import { Plus, Trash2, Sparkles, Save, User } from 'lucide-react';

export default function DoctorDashboard() {
  const { users, assignPlan } = useHelix();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Form State
  const [formType, setFormType] = useState<TaskType>('MEAL');
  const [formTime, setFormTime] = useState('08:00');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const clientUsers = users.filter(u => u.role === 'CLIENT');

  const addTask = () => {
    if (!formTitle) return;
    const newTask: Task = {
      id: Date.now().toString(),
      type: formType,
      time: formTime,
      title: formTitle,
      description: formDesc,
      completed: false
    };
    setTasks([...tasks, newTask]);
    // Reset form
    setFormTitle('');
    setFormDesc('');
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const simulateAI = () => {
    if (!selectedUserId) return alert("Please select a patient first.");
    
    // Simulating AI generation for a balanced diet
    const aiTasks: Task[] = [
      { id: 'ai1', type: 'MEAL', time: '07:30', title: 'Protein Oatmeal', description: 'Oats, scoop of whey, almond butter.', completed: false },
      { id: 'ai2', type: 'WORKOUT', time: '12:00', title: 'HIIT Session', description: '20 min high intensity interval training.', completed: false },
      { id: 'ai3', type: 'MEAL', time: '13:00', title: 'Grilled Chicken Salad', description: 'Chicken breast, mixed greens, olive oil dressing.', completed: false },
      { id: 'ai4', type: 'HABIT', time: '20:00', title: 'No Screen Time', description: 'Read a book instead of phone.', completed: false },
    ];
    setTasks(aiTasks);
  };

  const publishPlan = () => {
    if (!selectedUserId) return alert("Select a user");
    if (tasks.length === 0) return alert("Add tasks first");
    
    assignPlan(selectedUserId, tasks);
    alert("Plan published successfully!");
    setTasks([]);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Configuration */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User size={20} className="text-emerald-600" /> Patient Selection
          </h2>
          <select 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Select Patient...</option>
            {clientUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Plan Builder</h2>
            <button 
              onClick={simulateAI}
              className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-semibold border border-purple-100 hover:bg-purple-100 flex items-center gap-1 transition"
            >
              <Sparkles size={12} /> AI Generate
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                <select 
                  value={formType} 
                  onChange={(e) => setFormType(e.target.value as TaskType)}
                  className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-sm"
                >
                  <option value="MEAL">Meal</option>
                  <option value="WORKOUT">Workout</option>
                  <option value="HABIT">Habit</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Time</label>
                <input 
                  type="time" 
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Title</label>
              <input 
                type="text" 
                placeholder="e.g. Breakfast"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
              <textarea 
                placeholder="Details of the meal or exercise..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-sm h-20 resize-none"
              />
            </div>

            <button 
              onClick={addTask}
              className="w-full py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add to Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Preview & Publish */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Draft Schedule</h2>
            <button 
              onClick={publishPlan}
              disabled={tasks.length === 0 || !selectedUserId}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold shadow-emerald-200 shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition flex items-center gap-2"
            >
              <Save size={18} /> Publish Plan
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-xl p-10">
              <Plus size={48} className="mb-4" />
              <p className="font-medium">Schedule is empty</p>
              <p className="text-sm">Use the builder or AI to add tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm animate-fade-in-up">
                  <div className="text-slate-400 font-mono text-sm mr-4 w-12 text-center">
                    {task.time}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        task.type === 'MEAL' ? 'bg-orange-100 text-orange-700' : 
                        task.type === 'WORKOUT' ? 'bg-blue-100 text-blue-700' : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {task.type}
                      </span>
                      <h4 className="font-semibold text-slate-800">{task.title}</h4>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                  </div>
                  <button onClick={() => removeTask(task.id)} className="text-rose-400 hover:text-rose-600 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
