import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { PlanStatus } from '../../types';
import { Send, AlertCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PlanRequestPage: React.FC = () => {
  const { currentUser, requests, submitRequest } = useData();
  const navigate = useNavigate();
  
  // Form State
  const [formData, setFormData] = useState({
    goals: '',
    currentWeight: '',
    targetWeight: '',
    height: '',
    age: '',
    gender: 'Male',
    activityLevel: 'Sedentary',
    allergies: '',
    preferredMeals: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no package or expired
  useEffect(() => {
      if (currentUser) {
           if (!currentUser.activePackage) {
              const timer = setTimeout(() => navigate('/packages'), 100);
              return () => clearTimeout(timer);
           }
           // Check expiration
           if (currentUser.packageEndDate && new Date(currentUser.packageEndDate) < new Date()) {
               setError("Your subscription has expired. Please renew to request a new plan.");
           }
      }
  }, [currentUser, navigate]);

  if (!currentUser) return null;
  
  if (!currentUser.activePackage || error) return (
      <div className="text-center p-10">
          <Lock className="mx-auto text-gray-300 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900">Subscription Required</h2>
          <p className="text-gray-500 mb-4">{error || "Please subscribe to a package to request a plan."}</p>
          <button onClick={() => navigate('/packages')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">View Packages</button>
      </div>
  );

  const existingRequest = requests.find(r => r.clientId === currentUser.id);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitRequest(formData);
    setSubmitted(true);
  };

  if (existingRequest && !submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="text-blue-600" size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Request Status: {existingRequest.status}</h2>
        <p className="text-gray-500 mt-2">
          {existingRequest.status === PlanStatus.PROCESSING 
            ? 'Your plan is currently being designed by Dr. ' + (existingRequest.doctorName || 'Specialist') 
            : existingRequest.status === PlanStatus.PENDING_APPROVAL
            ? 'Your plan is awaiting final quality review by the Admin.'
            : 'You have submitted a request. An admin will assign a doctor shortly.'}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="text-green-600" size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Request Sent!</h2>
        <p className="text-gray-500 mt-2">Our team will analyze your profile and assign a personalized plan soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Setup Your Profile</h1>
        <p className="text-gray-500">Please provide detailed information for the best results.</p>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age</label>
                  <input required name="age" type="number" className="w-full p-2 border rounded-lg" onChange={handleChange} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                  <select name="gender" className="w-full p-2 border rounded-lg" onChange={handleChange}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Height (cm)</label>
                  <input required name="height" type="number" className="w-full p-2 border rounded-lg" onChange={handleChange} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Weight (kg)</label>
                  <input required name="currentWeight" type="number" className="w-full p-2 border rounded-lg" onChange={handleChange} />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Weight (kg)</label>
                  <input required name="targetWeight" type="number" className="w-full p-2 border rounded-lg" onChange={handleChange} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Activity Level</label>
                  <select name="activityLevel" className="w-full p-2 border rounded-lg" onChange={handleChange}>
                      <option value="Sedentary">Sedentary (Office job)</option>
                      <option value="Lightly Active">Lightly Active (1-3 days/week)</option>
                      <option value="Moderately Active">Moderately Active (3-5 days/week)</option>
                      <option value="Very Active">Very Active (6-7 days/week)</option>
                  </select>
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Main Health Goal</label>
            <textarea
              required
              name="goals"
              onChange={handleChange}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              rows={2}
              placeholder="E.g., Lose weight while building muscle..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies / Restrictions</label>
            <textarea
              name="allergies"
              onChange={handleChange}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              rows={2}
              placeholder="Gluten intolerance, peanuts, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Food Preferences</label>
            <textarea
              name="preferredMeals"
              onChange={handleChange}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              rows={2}
              placeholder="I like chicken, rice, italian food..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-blue-800">
              This information will be shared with your assigned doctor to create a safe and effective plan.
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition-colors"
          >
            Submit Profile
          </button>
        </form>
      </div>
    </div>
  );
};