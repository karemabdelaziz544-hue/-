
import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-semibold">Support Chat</h3>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
          
          <div className="flex-1 p-4 bg-slate-50 overflow-y-auto space-y-3">
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm text-sm text-slate-700 max-w-[80%]">
                Hello! How are you feeling about your plan today?
              </div>
            </div>
          </div>

          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
