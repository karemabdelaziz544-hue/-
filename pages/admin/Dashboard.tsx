
import React from 'react';
import { useHelix } from '../../context/HelixContext';
import { TrendingUp, Users, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { users, getUserProgress, plans } = useHelix();

  const clients = users.filter(u => u.role === 'CLIENT');
  const activePlans = plans.length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">System Monitoring</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Clients</p>
            <p className="text-2xl font-bold text-slate-800">{clients.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Active Plans</p>
            <p className="text-2xl font-bold text-slate-800">{activePlans}</p>
          </div>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Client Compliance (Today)</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Daily Progress</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(client => {
              const progress = getUserProgress(client.id);
              const hasPlan = plans.some(p => p.userId === client.id);

              return (
                <tr key={client.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img src={client.avatar} className="w-8 h-8 rounded-full" />
                    <span className="font-medium text-slate-700">{client.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    {hasPlan ? (
                      <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">Active</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold">Pending Plan</span>
                    )}
                  </td>
                  <td className="px-6 py-4 w-1/3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: `${progress}%` }} className="h-full bg-emerald-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-bold text-slate-600">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm text-slate-500 hover:text-emerald-600 font-medium">View Details</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
