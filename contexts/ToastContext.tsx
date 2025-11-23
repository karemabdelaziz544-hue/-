import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      
      {/* Toast Container rendered at the provider level for global overlay */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm transition-all animate-in slide-in-from-right fade-in duration-300
              ${toast.type === 'success' ? 'bg-white/95 border-emerald-100 text-emerald-800' : ''}
              ${toast.type === 'error' ? 'bg-white/95 border-red-100 text-red-800' : ''}
              ${toast.type === 'info' ? 'bg-white/95 border-blue-100 text-blue-800' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-500" />}
            {toast.type === 'error' && <XCircle size={18} className="text-red-500" />}
            {toast.type === 'info' && <Info size={18} className="text-blue-500" />}
            
            <p className="text-sm font-medium pr-4">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)} 
              className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
