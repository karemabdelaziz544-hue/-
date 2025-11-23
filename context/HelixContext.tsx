
import React, { createContext, useContext, useState, ReactNode } from 'react';

// --- Types ---
export type Role = 'CLIENT' | 'ADMIN' | 'DOCTOR';
export type TaskType = 'MEAL' | 'WORKOUT' | 'HABIT';

export interface Task {
  id: string;
  type: TaskType;
  time: string;
  title: string;
  description: string;
  completed: boolean;
  calories?: number;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
}

interface Plan {
  userId: string;
  date: string;
  tasks: Task[];
}

interface HelixContextType {
  currentUser: User | null;
  users: User[]; // List of all users (for Admin/Doctor)
  plans: Plan[];
  login: (role: Role) => void;
  logout: () => void;
  assignPlan: (userId: string, tasks: Task[]) => void;
  toggleTask: (userId: string, taskId: string) => void;
  getPlanForUser: (userId: string) => Plan | undefined;
  getUserProgress: (userId: string) => number; // Returns 0-100
}

const HelixContext = createContext<HelixContextType | undefined>(undefined);

// --- Mock Data ---
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sarah Jenkins', role: 'CLIENT', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'u2', name: 'Mike Ross', role: 'CLIENT', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
  { id: 'd1', name: 'Dr. Emily Strange', role: 'DOCTOR', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
  { id: 'a1', name: 'Admin System', role: 'ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' },
];

export const HelixProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([
    // Seed data: Sarah has a plan, Mike does not
    {
      userId: 'u1',
      date: new Date().toISOString().split('T')[0],
      tasks: [
        { id: 't1', type: 'MEAL', time: '08:00', title: 'Oatmeal & Berries', description: '50g oats, water, blueberries.', completed: true },
        { id: 't2', type: 'HABIT', time: '09:00', title: 'Hydration', description: 'Drink 500ml Water', completed: false },
        { id: 't3', type: 'WORKOUT', time: '17:00', title: 'Light Cardio', description: '30 min brisk walk', completed: false },
      ]
    }
  ]);

  const login = (role: Role) => {
    // Simulating login by picking the first user of that role
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) setCurrentUser(user);
  };

  const logout = () => setCurrentUser(null);

  const assignPlan = (userId: string, tasks: Task[]) => {
    const newPlan: Plan = {
      userId,
      date: new Date().toISOString().split('T')[0],
      tasks
    };
    
    // Replace existing plan for demo simplicity, or add new
    setPlans(prev => {
      const filtered = prev.filter(p => p.userId !== userId);
      return [...filtered, newPlan];
    });
  };

  const toggleTask = (userId: string, taskId: string) => {
    setPlans(prev => prev.map(plan => {
      if (plan.userId !== userId) return plan;
      return {
        ...plan,
        tasks: plan.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      };
    }));
  };

  const getPlanForUser = (userId: string) => plans.find(p => p.userId === userId);

  const getUserProgress = (userId: string) => {
    const plan = plans.find(p => p.userId === userId);
    if (!plan || plan.tasks.length === 0) return 0;
    const completed = plan.tasks.filter(t => t.completed).length;
    return Math.round((completed / plan.tasks.length) * 100);
  };

  return (
    <HelixContext.Provider value={{ 
      currentUser, 
      users: MOCK_USERS, 
      plans, 
      login, 
      logout, 
      assignPlan, 
      toggleTask, 
      getPlanForUser,
      getUserProgress 
    }}>
      {children}
    </HelixContext.Provider>
  );
};

export const useHelix = () => {
  const context = useContext(HelixContext);
  if (!context) throw new Error("useHelix must be used within HelixProvider");
  return context;
};
