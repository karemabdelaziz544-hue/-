import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Calendar, CreditCard, Activity } from 'lucide-react';

export const MyPackage: React.FC = () => {
  const { currentUser, packages, subscribeToPackage } = useData();
  
  if (!currentUser?.activePackage) return null;
  
  const endDate = new Date(currentUser.packageEndDate!);
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 3600 * 24));
  const isExpired = daysLeft < 0;

  // Assuming activePackage is populated object
  // @ts-ignore 
  const pkgName = currentUser.activePackage.name;
  // @ts-ignore
  const pkgPrice = currentUser.activePackage.price;

  const handleRenew = async (pkgId: string) => {
     if(confirm('Renew subscription?')) {
         await subscribeToPackage(pkgId);
     }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Subscription</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="bg-emerald-600 p-6 text-white">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-emerald-100 text-sm font-medium mb-1">Current Plan</p>
                    <h2 className="text-3xl font-bold">{pkgName}</h2>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                    <CreditCard size={24} />
                </div>
            </div>
         </div>
         
         <div className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${!isExpired ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {!isExpired ? 'Active' : 'Expired'}
                </span>
            </div>
            
            <div className="space-y-1">
                <p className="text-sm text-gray-500">Expires On</p>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Calendar size={16} className="text-gray-400" />
                    {endDate.toLocaleDateString()}
                    <span className={`text-xs ${daysLeft < 5 ? 'text-red-500' : 'text-gray-400'}`}>
                        ({daysLeft > 0 ? `${daysLeft} days left` : 'Expired'})
                    </span>
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-sm text-gray-500">Plan Cost</p>
                <p className="text-gray-900 font-medium">${pkgPrice}</p>
            </div>
         </div>

         <div className="p-6 bg-gray-50 border-t border-gray-100">
            <h3 className="font-medium text-gray-900 mb-4">Renew or Change Plan</h3>
            <div className="grid gap-3">
                {packages.map(p => (
                    <button 
                        key={p.id}
                        onClick={() => handleRenew(p.id)}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow-sm transition-all group text-left"
                    >
                        <div>
                            <span className="font-bold text-gray-800">{p.name}</span>
                            <span className="text-sm text-gray-500 ml-2">(${p.price} / {p.durationDays}d)</span>
                        </div>
                        <div className="text-emerald-600 opacity-0 group-hover:opacity-100 font-medium text-sm">
                            Select
                        </div>
                    </button>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};