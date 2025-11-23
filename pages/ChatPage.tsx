import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { Send, User as UserIcon, Stethoscope, Shield } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const ChatPage: React.FC = () => {
  const { currentUser, users, messages, sendMessage, loadMessages, requests } = useData();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  // Logic to show relevant contacts
  const contacts = users.filter(u => {
      if (currentUser?.role === UserRole.ADMIN) return u.role !== UserRole.ADMIN; 
      if (currentUser?.role === UserRole.DOCTOR) {
          if (u.role === UserRole.ADMIN) return true;
          const isAssigned = requests.some(r => r.clientId === u.id && r.doctorId === currentUser.id);
          return isAssigned;
      }
      if (currentUser?.role === UserRole.CLIENT) {
          if (u.role === UserRole.ADMIN) return true;
          const myPlan = requests.find(r => r.clientId === currentUser.id);
          return myPlan?.doctorId === u.id;
      }
      return false;
  });

  // Handle URL query param for auto-selection
  useEffect(() => {
      const userIdFromUrl = searchParams.get('userId');
      if (userIdFromUrl && contacts.find(c => c.id === userIdFromUrl)) {
          setSelectedContactId(userIdFromUrl);
      }
  }, [searchParams, contacts]);

  useEffect(() => {
    if (selectedContactId) loadMessages(selectedContactId);
  }, [selectedContactId]);

  const activeMessages = selectedContactId 
    ? messages.filter(m => 
        (m.senderId === currentUser?.id && m.receiverId === selectedContactId) ||
        (m.senderId === selectedContactId && m.receiverId === currentUser?.id)
      ).sort((a, b) => a.timestamp - b.timestamp)
    : [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeMessages, selectedContactId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && selectedContactId) {
      sendMessage(selectedContactId, inputText);
      setInputText('');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-200 flex overflow-hidden">
      {/* Contact List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 font-semibold text-gray-700 bg-white">
          Messages
        </div>
        <div className="overflow-y-auto flex-1">
          {contacts.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center mt-4">No active contacts available.</p>
          ) : (
              contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`w-full text-left p-4 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-0 ${
                    selectedContactId === contact.id ? 'bg-white border-l-4 border-l-emerald-500 shadow-sm' : 'hover:bg-white/50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="relative">
                    <img src={contact.avatar || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                    {contact.role === UserRole.DOCTOR && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <Stethoscope size={12} className="text-blue-500" />
                        </div>
                    )}
                    {contact.role === UserRole.ADMIN && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <Shield size={12} className="text-emerald-600" />
                        </div>
                    )}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${selectedContactId === contact.id ? 'text-emerald-900' : 'text-gray-900'}`}>{contact.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{contact.role.toLowerCase()}</p>
                  </div>
                </button>
              ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedContactId ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white shadow-sm z-10">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                {users.find(u => u.id === selectedContactId)?.name.charAt(0)}
              </div>
              <span className="font-semibold text-gray-900">
                {users.find(u => u.id === selectedContactId)?.name}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
              {activeMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 text-sm">No messages yet. Say hello!</div>
              ) : (
                activeMessages.map(msg => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                        isMe 
                        ? 'bg-emerald-600 text-white rounded-br-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <div className="text-[10px] text-gray-400 self-end ml-2 mb-1 opacity-0 group-hover:opacity-100">
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"
              />
              <button type="submit" disabled={!inputText.trim()} className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserIcon size={40} className="text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500">Your Messages</p>
            <p className="text-sm">Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};