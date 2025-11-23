import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { PlanStatus, UserRole } from '../../types';
import { Users, FileText, Search, Stethoscope, MessageSquare, Package as PackageIcon, Settings, Trash2, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { requests, users, doctors, assignRequestToDoctor, packages, createPackage, deletePackage, updateUser } = useData();
  const [activeTab, setActiveTab] = useState<'requests' | 'clients' | 'packages' | 'users'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const navigate = useNavigate();

  // Package Form State
  const [newPkg, setNewPkg] = useState({ name: '', price: 0, durationDays: 30, features: '' });

  const clients = users.filter(u => u.role === 'CLIENT' && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const allUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const allRequests = requests;

  const handleAssign = async (reqId: string, doctorId: string) => {
      await assignRequestToDoctor(reqId, doctorId);
      setAssignModal(null);
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
      e.preventDefault();
      await createPackage({ ...newPkg, features: newPkg.features.split(',').map(s => s.trim()) });
      setNewPkg({ name: '', price: 0, durationDays: 30, features: '' });
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
      if(confirm(`Change role to ${newRole}?`)) {
          await updateUser(userId, { role: newRole });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Control</h1>
        
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-2"><FileText size={16} /> Requests</div>
          </button>
          <button onClick={() => setActiveTab('clients')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'clients' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
             <div className="flex items-center gap-2"><Users size={16} /> Clients</div>
          </button>
          <button onClick={() => setActiveTab('packages')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'packages' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
             <div className="flex items-center gap-2"><PackageIcon size={16} /> Packages</div>
          </button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
             <div className="flex items-center gap-2"><Settings size={16} /> Users</div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
          
          {activeTab === 'requests' && (
            <div className="space-y-4">
               <h2 className="text-lg font-semibold text-gray-700 mb-4">Plan Requests</h2>
               <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metrics</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                       <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {allRequests.map(req => (
                       <tr key={req.id}>
                         <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.clientName}</td>
                         <td className="px-6 py-4 text-sm text-gray-500">
                             {req.age}yrs, {req.currentWeight}kg, {req.goals.substring(0,20)}...
                         </td>
                         <td className="px-6 py-4"><span className="px-2 text-xs rounded-full bg-blue-100 text-blue-800">{req.status}</span></td>
                         <td className="px-6 py-4 text-sm text-gray-500">{req.doctorName || 'Unassigned'}</td>
                         <td className="px-6 py-4 text-right">
                            <button onClick={() => setAssignModal(req.id)} className="text-indigo-600 hover:underline text-sm">
                                {req.status === 'PROCESSING' ? 'Reassign' : 'Assign'}
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
               </table>
            </div>
          )}

          {activeTab === 'packages' && (
              <div className="space-y-8">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <h3 className="font-bold text-gray-700 mb-4">Create New Package</h3>
                      <form onSubmit={handleCreatePackage} className="flex gap-4 items-end">
                          <div>
                              <label className="text-xs text-gray-500">Name</label>
                              <input type="text" value={newPkg.name} onChange={e => setNewPkg({...newPkg, name: e.target.value})} className="border rounded p-2 w-40" required />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500">Price</label>
                              <input type="number" value={newPkg.price} onChange={e => setNewPkg({...newPkg, price: parseFloat(e.target.value)})} className="border rounded p-2 w-24" required />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500">Days</label>
                              <input type="number" value={newPkg.durationDays} onChange={e => setNewPkg({...newPkg, durationDays: parseInt(e.target.value)})} className="border rounded p-2 w-20" required />
                          </div>
                          <div className="flex-1">
                              <label className="text-xs text-gray-500">Features (comma sep)</label>
                              <input type="text" value={newPkg.features} onChange={e => setNewPkg({...newPkg, features: e.target.value})} className="border rounded p-2 w-full" placeholder="Chat, AI Plan..." required />
                          </div>
                          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Create</button>
                      </form>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {packages.map(pkg => (
                          <div key={pkg.id} className="border border-gray-200 rounded-lg p-4 relative group">
                              <h4 className="font-bold text-lg">{pkg.name}</h4>
                              <p className="text-emerald-600 font-bold">${pkg.price} <span className="text-gray-400 font-normal">/ {pkg.durationDays}d</span></p>
                              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                                  {pkg.features.map((f,i) => <li key={i}>• {f}</li>)}
                              </ul>
                              <button onClick={() => deletePackage(pkg.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'users' && (
             <div className="space-y-4">
                <div className="relative w-64 mb-4">
                     <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 border rounded-lg p-2" />
                     <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Package</th>
                       <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Manage</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {allUsers.map(u => (
                       <tr key={u.id}>
                         <td className="px-6 py-4 flex items-center gap-3">
                             <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                             <div>
                                 <p className="text-sm font-medium">{u.name}</p>
                                 <p className="text-xs text-gray-500">{u.email}</p>
                             </div>
                         </td>
                         <td className="px-6 py-4 text-sm">{u.role}</td>
                         {/* @ts-ignore */}
                         <td className="px-6 py-4 text-sm text-gray-500">{u.activePackage?.name || '-'}</td>
                         <td className="px-6 py-4 text-right">
                             <select 
                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                value={u.role}
                                className="text-xs border rounded p-1 bg-white"
                             >
                                 <option value="CLIENT">Client</option>
                                 <option value="DOCTOR">Doctor</option>
                                 <option value="ADMIN">Admin</option>
                             </select>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
             </div>
          )}

          {activeTab === 'clients' && (
             // Simple Client List reusing logic
             <div className="grid grid-cols-3 gap-4">
                 {clients.map(c => (
                     <div key={c.id} className="border rounded-lg p-4 flex items-center gap-3">
                         <img src={c.avatar} className="w-10 h-10 rounded-full" alt="" />
                         <div className="flex-1">
                             <p className="font-bold text-sm">{c.name}</p>
                             {/* @ts-ignore */}
                             <p className="text-xs text-emerald-600">{c.activePackage ? c.activePackage.name : 'No Plan'}</p>
                         </div>
                         <button onClick={() => navigate(`/chat?userId=${c.id}`)} className="p-2 bg-emerald-50 text-emerald-600 rounded-full"><MessageSquare size={16}/></button>
                     </div>
                 ))}
             </div>
          )}
      </div>

      {/* Assign Modal */}
      {assignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-96">
                  <h3 className="font-bold mb-4">Select Specialist</h3>
                  <div className="space-y-2 max-h-60 overflow-auto">
                      {doctors.map(doc => (
                          <button key={doc.id} onClick={() => handleAssign(assignModal, doc.id)} className="w-full flex items-center p-3 border rounded hover:bg-emerald-50">
                              <img src={doc.avatar} className="w-8 h-8 rounded-full mr-2" alt=""/> {doc.name}
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setAssignModal(null)} className="w-full mt-4 py-2 text-gray-500">Cancel</button>
              </div>
          </div>
      )}
    </div>
  );
};