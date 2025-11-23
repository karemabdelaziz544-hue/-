import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Check, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MyPackage } from './MyPackage';

export const Packages: React.FC = () => {
  const { packages, subscribeToPackage, currentUser } = useData();
  const navigate = useNavigate();

  const handleSubscribe = async (pkgId: string) => {
      if(confirm('Confirm subscription?')) {
          await subscribeToPackage(pkgId);
          navigate('/request'); // Redirect to form after sub
      }
  };

  if (currentUser?.activePackage) {
      return <MyPackage />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Health Journey</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">Select a package that fits your goals. All plans include access to our certified nutritionists and doctors.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow relative">
            {pkg.price > 50 && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    BEST VALUE
                </div>
            )}
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-emerald-600">${pkg.price}</span>
                <span className="text-gray-500">/ {pkg.durationDays} days</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {pkg.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 bg-emerald-100 rounded-full p-0.5">
                        <Check size={14} className="text-emerald-600" />
                    </div>
                    <span className="text-gray-600 text-sm">{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleSubscribe(pkg.id)}
                className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                {pkg.price > 50 ? <Crown size={18} className="text-yellow-400" /> : <Star size={18} />}
                Subscribe Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};