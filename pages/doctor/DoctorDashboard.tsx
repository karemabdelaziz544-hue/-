import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { PlanStatus, DailyTask } from '../../types';
import { generateTasksFromDoctorNotes } from '../../services/geminiService';
import { Sparkles, Calendar, CheckSquare, User, ClipboardList, Eye, Save, XCircle, AlertCircle } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { requests, assignTasks, currentUser } = useData();
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for Preview Mode
  const [previewTasks, setPreviewTasks] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const myPendingRequests = requests.filter(
      r => r.doctorId === currentUser?.id && r.status === PlanStatus.PROCESSING
  );
  
  const selectedReq = requests.find(r => r.id === selectedReqId);

  const handleGeneratePreview = async () => {
    if (!selectedReq || !doctorNotes) return;
    setIsGenerating(true);
    setPreviewTasks([]);
    
    // Passing detailed info to AI service could be done by appending to notes, 
    // but here we trust the doctor read the info and wrote good notes.
    const generated = await generateTasksFromDoctorNotes(doctorNotes, startDate, endDate);
    
    if (generated && generated.length > 0) {
        setPreviewTasks(generated);
        setShowPreview(true);
    } else {
        alert("Could not generate tasks. Please refine your notes.");
    }
    setIsGenerating(false);
  };

  const handleConfirmAssignment = async () => {
      if (!selectedReq || previewTasks.length === 0) return;
      
      await assignTasks(selectedReq.clientId, previewTasks, startDate, endDate);
      
      setDoctorNotes('');
      setSelectedReqId(null);
      setPreviewTasks([]);
      setShowPreview(false);
      alert("Plan successfully assigned to " + selectedReq.clientName);
  };

  const handleCancelPreview = () => {
      setShowPreview(false);
      setPreviewTasks([]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Patient Requests List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-700">Assigned Patients</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                    {myPendingRequests.length}
                </span>
            </div>
            
            {myPendingRequests.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-400">
                    <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No pending patient reviews.</p>
                </div>
            ) : (
                <div className="space-y-3">
                {myPendingRequests.map(req => (
                    <div 
                        key={req.id}
                        onClick={() => {
                            setSelectedReqId(req.id);
                            setShowPreview(false);
                            setPreviewTasks([]);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                            selectedReqId === req.id 
                            ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                            : 'bg-white border-gray-200 hover:border-emerald-300'
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold shadow-sm">
                                {req.clientName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">{req.clientName}</h3>
                                <p className="text-xs text-gray-500">Req: {new Date(req.requestDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 mt-2 bg-white/50 p-2 rounded-lg">
                            <AlertCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600 line-clamp-2 italic">"{req.goals}"</p>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>

        {/* Right: Workspace (8 cols) */}
        <div className="lg:col-span-8">
            {selectedReq ? (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {/* Detailed Patient Info Header */}
                    <div className="bg-gray-50 border-b border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Plan Generation</h2>
                                <p className="text-sm text-gray-500">Drafting for <span className="font-semibold text-emerald-700">{selectedReq.clientName}</span></p>
                            </div>
                            <button onClick={() => setSelectedReqId(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-white p-4 rounded-lg border border-gray-200">
                            <div><span className="text-xs text-gray-400 block">AGE</span><span className="font-medium">{selectedReq.age || '-'}</span></div>
                            <div><span className="text-xs text-gray-400 block">GENDER</span><span className="font-medium">{selectedReq.gender || '-'}</span></div>
                            <div><span className="text-xs text-gray-400 block">WEIGHT</span><span className="font-medium">{selectedReq.currentWeight || '-'} kg</span></div>
                            <div><span className="text-xs text-gray-400 block">HEIGHT</span><span className="font-medium">{selectedReq.height || '-'} cm</span></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <span className="block text-xs font-bold text-gray-400 uppercase">Main Goal</span>
                                <p className="text-gray-800 text-sm">{selectedReq.goals}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <span className="block text-xs font-bold text-gray-400 uppercase">Restrictions & Allergies</span>
                                <p className="text-red-600 font-medium text-sm">{selectedReq.allergies || 'None'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Editing Mode */}
                    {!showPreview ? (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                    Clinical Instructions for AI
                                </label>
                                <textarea 
                                    className="w-full p-4 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[180px]"
                                    placeholder="Write your assessment here. E.g. 'Patient needs a high protein diet. Avoid gluten. Include 20mins cardio daily.'"
                                    value={doctorNotes}
                                    onChange={(e) => setDoctorNotes(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleGeneratePreview}
                                disabled={isGenerating || !doctorNotes}
                                className={`w-full py-3 px-4 rounded-lg text-white font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${
                                isGenerating || !doctorNotes 
                                ? 'bg-gray-300 cursor-not-allowed' 
                                : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md'
                                }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Eye size={20} />
                                        Preview Plan
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        // Preview Mode
                        <div className="p-6 flex flex-col h-[600px]">
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Sparkles className="text-purple-500" size={20} /> 
                                    AI Generated Preview
                                </h3>
                                <div className="text-sm text-gray-500">
                                    {previewTasks.length} tasks generated
                                </div>
                             </div>

                             <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-4 space-y-4 mb-4">
                                {Object.entries(previewTasks.reduce((acc:any, task:any) => {
                                    (acc[task.date] = acc[task.date] || []).push(task);
                                    return acc;
                                }, {})).map(([date, tasks]: [string, any]) => (
                                    <div key={date} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                        <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                                            <Calendar size={16} className="text-emerald-600" />
                                            {date}
                                        </h4>
                                        <ul className="space-y-2">
                                            {tasks.map((t:any, idx:number) => (
                                                <li key={idx} className="text-sm flex items-start gap-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        t.type === 'MEAL' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {t.type}
                                                    </span>
                                                    <div>
                                                        <span className="font-medium text-gray-900">{t.title}</span>
                                                        <span className="text-gray-500 ml-1">- {t.description}</span>
                                                        {t.time && <span className="text-gray-400 ml-2 text-xs">({t.time})</span>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                             </div>

                             <div className="flex gap-3">
                                 <button 
                                    onClick={handleCancelPreview}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50"
                                 >
                                     Edit Notes
                                 </button>
                                 <button 
                                    onClick={handleConfirmAssignment}
                                    className="flex-2 w-2/3 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2"
                                 >
                                     <Save size={20} />
                                     Confirm & Assign Plan
                                 </button>
                             </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 p-12 min-h-[500px]">
                    <User size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select a patient to start</p>
                    <p className="text-sm">AI will help you draft a schedule based on your notes.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};