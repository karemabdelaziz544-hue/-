import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, PlanRequest, DailyTask, ChatMessage, PlanStatus, ProgressStats, Package } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface DataContextType {
  users: User[];
  doctors: User[];
  currentUser: User | null;
  requests: PlanRequest[];
  tasks: DailyTask[];
  messages: ChatMessage[];
  packages: Package[];
  isLoading: boolean;
  
  login: (email: string, role: UserRole) => Promise<boolean>;
  register: (name: string, email: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  
  submitRequest: (data: any) => Promise<void>;
  assignRequestToDoctor: (reqId: string, doctorId: string) => Promise<void>;
  
  assignTasks: (clientId: string, newTasks: Partial<DailyTask>[], startDate: string, endDate: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  
  sendMessage: (receiverId: string, text: string) => Promise<void>;
  loadMessages: (otherUserId: string) => Promise<void>;
  getClientTasks: (clientId: string) => DailyTask[];
  getClientStats: (clientId: string, range?: 'week' | 'month') => Promise<ProgressStats[]>;
  
  // Package & User Management
  getPackages: () => Promise<void>;
  subscribeToPackage: (packageId: string) => Promise<void>;
  createPackage: (data: Partial<Package>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  updateUser: (userId: string, data: any) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('helix_user');
    const storedToken = localStorage.getItem('helix_token');
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (currentUser && token) {
      const socket = socketService.connect(token);
      socket?.emit('join', currentUser.id);
      // @ts-ignore
      socket?.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
      // @ts-ignore
      socket?.on('message_sent', (msg) => setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
      }));
      return () => {};
    }
  }, [currentUser, token]);

  useEffect(() => {
    if (currentUser && token) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
           const [usersData, reqData, pkgData] = await Promise.all([
             api.getUsers(token),
             api.getRequests(token),
             api.getPackages(token)
           ]);
           setUsers(usersData);
           setRequests(reqData);
           setPackages(pkgData);
           
           if (currentUser.role === UserRole.CLIENT) {
               const myTasks = await api.getTasks(token, currentUser.id);
               setTasks(myTasks);
           }
        } catch (e) {
          console.error("Failed to load data", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [currentUser, token]);

  const login = async (email: string, role: UserRole) => {
    try {
      const data = await api.login(email, role);
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem('helix_user', JSON.stringify(data.user));
      localStorage.setItem('helix_token', data.token);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const register = async (name: string, email: string, role: UserRole) => {
    try {
      const data = await api.register(name, email, role);
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem('helix_user', JSON.stringify(data.user));
      localStorage.setItem('helix_token', data.token);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    setRequests([]);
    setTasks([]);
    setMessages([]);
    localStorage.removeItem('helix_user');
    localStorage.removeItem('helix_token');
    socketService.disconnect();
  };

  const submitRequest = async (data: any) => {
    if (!token) return;
    const newReq = await api.submitRequest(token, data);
    setRequests(prev => [...prev, newReq]);
  };

  const assignRequestToDoctor = async (reqId: string, doctorId: string) => {
    if (!token) return;
    await api.assignRequestToDoctor(token, reqId, doctorId);
    const reqData = await api.getRequests(token);
    setRequests(reqData);
  };

  const assignTasks = async (clientId: string, newTasks: Partial<DailyTask>[], startDate: string, endDate: string) => {
    if (!token) return;
    const created = await api.assignTasks(token, clientId, newTasks, startDate, endDate);
    if (currentUser?.role === UserRole.CLIENT || tasks.some(t => t.clientId === clientId)) {
        setTasks(prev => [...prev, ...created]);
    }
    setRequests(prev => prev.map(r => r.clientId === clientId ? { ...r, status: PlanStatus.ACTIVE } : r));
  };

  const toggleTaskCompletion = async (taskId: string) => {
    if (!token) return;
    try {
        const updated = await api.toggleTask(token, taskId);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: updated.status } : t));
    } catch(e) {
        console.error(e);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!token) return;
    const msgs = await api.getMessages(token, otherUserId);
    setMessages(msgs);
  };

  const sendMessage = async (receiverId: string, text: string) => {
    if (!currentUser || !token) return;
    const tempId = 'temp-' + Date.now();
    const optimisticMsg: ChatMessage = { id: tempId, senderId: currentUser.id, receiverId, text, timestamp: Date.now(), read: false };
    setMessages(prev => [...prev, optimisticMsg]);

    const socket = socketService.connect(token);
    if (socket && !api.isMock()) {
        socket.emit('send_message', { senderId: currentUser.id, receiverId, text });
    } else if (api.isMock()) {
       const realMsg = await api.sendMockMessage(currentUser.id, receiverId, text);
       setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
    }
  };

  const getClientTasks = useCallback((clientId: string) => {
    return tasks.filter(t => t.clientId === clientId);
  }, [tasks]);

  const getClientStats = async (clientId: string, range: 'week' | 'month' = 'week') => {
    if (!token) return [];
    return api.getClientStats(token, clientId, range);
  };

  const getPackages = async () => {
      if(!token) return;
      const pkgs = await api.getPackages(token);
      setPackages(pkgs);
  };

  const subscribeToPackage = async (packageId: string) => {
      if(!token) return;
      const res = await api.subscribe(token, packageId);
      setCurrentUser(res.user);
      localStorage.setItem('helix_user', JSON.stringify(res.user));
      // Refresh users list if admin viewing
      if(users.length > 0) {
          setUsers(prev => prev.map(u => u.id === res.user.id ? res.user : u));
      }
  };

  const createPackage = async (data: Partial<Package>) => {
      if(!token) return;
      const newPkg = await api.createPackage(token, data);
      setPackages(prev => [...prev, newPkg]);
  };

  const deletePackage = async (id: string) => {
      if(!token) return;
      await api.deletePackage(token, id);
      setPackages(prev => prev.filter(p => p.id !== id));
  };

  const updateUser = async (userId: string, data: any) => {
      if(!token) return;
      const updated = await api.updateUser(token, userId, data);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
  };

  const doctors = users.filter(u => u.role === UserRole.DOCTOR);

  return (
    <DataContext.Provider value={{
      users, doctors, currentUser, requests, tasks, messages, packages, isLoading,
      login, register, logout, submitRequest, assignRequestToDoctor,
      assignTasks, toggleTaskCompletion, sendMessage, loadMessages,
      getClientTasks, getClientStats, 
      getPackages, subscribeToPackage, createPackage, deletePackage, updateUser
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};