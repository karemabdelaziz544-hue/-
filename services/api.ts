import { User, UserRole, PlanRequest, DailyTask, ChatMessage, PlanStatus, TaskStatus, ProgressStats, Package } from '../types';

const USE_MOCK_DATA = true;
const API_URL = 'http://localhost:5000/api';

let SEED_USERS: User[] = [
  { id: 'admin1', name: 'Dr. Helix Admin', email: 'admin@helix.com', role: UserRole.ADMIN, avatar: 'https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff' },
  { id: 'doc1', name: 'Dr. Sarah Smith', email: 'doctor@helix.com', role: UserRole.DOCTOR, avatar: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=0ea5e9&color=fff' },
  { id: 'client1', name: 'Alice Johnson', email: 'alice@example.com', role: UserRole.CLIENT, avatar: 'https://ui-avatars.com/api/?name=Alice&background=random' },
  { id: 'client2', name: 'Bob Smith', email: 'bob@example.com', role: UserRole.CLIENT, avatar: 'https://ui-avatars.com/api/?name=Bob&background=random' },
];

let mockRequests: PlanRequest[] = [];
let mockTasks: DailyTask[] = [];
let mockMessages: ChatMessage[] = [];
let mockPackages: Package[] = [
    { id: 'pkg1', name: 'Basic Start', durationDays: 30, price: 29.99, features: ['AI Diet Plan', 'Weekly Progress'], isActive: true },
    { id: 'pkg2', name: 'Premium Health', durationDays: 90, price: 79.99, features: ['AI Diet Plan', 'Daily Chat Support', 'Priority Doctor Review'], isActive: true }
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  isMock: () => USE_MOCK_DATA,

  // AUTH
  login: async (email: string, role: UserRole) => {
    if (USE_MOCK_DATA) {
      await delay(500);
      const user = SEED_USERS.find(u => u.email === email && u.role === role);
      if (user) return { user, token: 'mock-jwt-token' };
      throw new Error('Invalid credentials');
    }
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password', role })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  register: async (name: string, email: string, role: UserRole) => {
    if (USE_MOCK_DATA) {
      await delay(500);
      const newUser: User = { 
        id: `user-${Date.now()}`, 
        name, email, role, 
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
      SEED_USERS.push(newUser);
      return { user: newUser, token: 'mock-jwt-token-new' };
    }
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: 'password', role })
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  getUsers: async (token: string) => {
    if (USE_MOCK_DATA) return SEED_USERS;
    const res = await fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },

  updateUser: async (token: string, userId: string, data: any) => {
      if (USE_MOCK_DATA) {
          const idx = SEED_USERS.findIndex(u => u.id === userId);
          if (idx !== -1) {
              SEED_USERS[idx] = { ...SEED_USERS[idx], ...data };
              return SEED_USERS[idx];
          }
          return null;
      }
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      return res.json();
  },

  // PACKAGES
  getPackages: async (token: string) => {
      if(USE_MOCK_DATA) return mockPackages.filter(p => p.isActive);
      const res = await fetch(`${API_URL}/packages`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
  },

  createPackage: async (token: string, data: Partial<Package>) => {
      if(USE_MOCK_DATA) {
          const newPkg = { ...data, id: `pkg-${Date.now()}`, isActive: true } as Package;
          mockPackages.push(newPkg);
          return newPkg;
      }
      const res = await fetch(`${API_URL}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      return res.json();
  },

  deletePackage: async (token: string, id: string) => {
      if(USE_MOCK_DATA) {
          mockPackages = mockPackages.filter(p => p.id !== id);
          return;
      }
      await fetch(`${API_URL}/packages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  },

  subscribe: async (token: string, packageId: string) => {
      if(USE_MOCK_DATA) {
          const user = JSON.parse(localStorage.getItem('helix_user') || '{}');
          const pkg = mockPackages.find(p => p.id === packageId);
          if(pkg) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + pkg.durationDays);
            
            const idx = SEED_USERS.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                SEED_USERS[idx].activePackage = pkg;
                SEED_USERS[idx].packageEndDate = endDate.toISOString();
                return { user: SEED_USERS[idx] };
            }
          }
          throw new Error('Failed');
      }
      const res = await fetch(`${API_URL}/packages/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId })
      });
      return res.json();
  },

  // REQUESTS
  getRequests: async (token: string) => {
    if (USE_MOCK_DATA) {
        await delay(300);
        return mockRequests;
    }
    const res = await fetch(`${API_URL}/requests`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },

  submitRequest: async (token: string, data: any) => {
    if (USE_MOCK_DATA) {
        const user = JSON.parse(localStorage.getItem('helix_user') || '{}');
        const newReq: PlanRequest = {
            id: Math.random().toString(36).substr(2, 9),
            clientId: user.id,
            clientName: user.name,
            status: PlanStatus.REQUESTED,
            requestDate: new Date().toISOString(),
            ...data
        };
        mockRequests.push(newReq);
        return newReq;
    }
    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  assignRequestToDoctor: async (token: string, reqId: string, doctorId: string) => {
      if (USE_MOCK_DATA) {
        const req = mockRequests.find(r => r.id === reqId);
        const doc = SEED_USERS.find(u => u.id === doctorId);
        if (req && doc) {
            req.status = PlanStatus.PROCESSING;
            req.doctorId = doctorId;
            req.doctorName = doc.name;
        }
        return req;
      }
      const res = await fetch(`${API_URL}/requests/${reqId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorId })
      });
      return res.json();
  },

  // TASKS
  getTasks: async (token: string, clientId?: string, date?: string) => {
    if (USE_MOCK_DATA) {
        const user = JSON.parse(localStorage.getItem('helix_user') || '{}');
        const targetId = user.role === 'CLIENT' ? user.id : clientId;
        let result = mockTasks.filter(t => t.clientId === targetId);
        if (date) result = result.filter(t => t.date === date);
        return result;
    }
    const query = new URLSearchParams();
    if (clientId) query.append('clientId', clientId);
    if (date) query.append('date', date);
    const res = await fetch(`${API_URL}/tasks?${query.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },

  assignTasks: async (token: string, clientId: string, tasks: Partial<DailyTask>[], startDate: string, endDate: string) => {
    if (USE_MOCK_DATA) {
        const createdTasks: DailyTask[] = [];
        tasks.forEach(t => {
            createdTasks.push({
                ...t,
                id: Math.random().toString(36).substr(2, 9),
                clientId,
                status: TaskStatus.PENDING
            } as DailyTask);
        });
        
        mockTasks.push(...createdTasks);
        const req = mockRequests.find(r => r.clientId === clientId);
        if(req) req.status = PlanStatus.ACTIVE;
        return createdTasks;
    }
    const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId, tasks, startDate, endDate })
      });
      return res.json();
  },

  toggleTask: async (token: string, taskId: string) => {
    if (USE_MOCK_DATA) {
        const task = mockTasks.find(t => t.id === taskId);
        if (task) task.status = task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
        return task;
    }
    const res = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  getClientStats: async (token: string, clientId: string, range: 'week' | 'month' = 'week'): Promise<ProgressStats[]> => {
    if (USE_MOCK_DATA) {
      const stats: ProgressStats[] = [];
      const days = range === 'month' ? 30 : 7;
      const today = new Date();
      for(let i=days-1; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const total = Math.floor(Math.random() * 4) + 3;
        const completed = Math.floor(Math.random() * (total + 1));
        stats.push({
          date: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
          total,
          completed,
          rate: Math.round((completed/total)*100)
        });
      }
      return stats;
    }
    const res = await fetch(`${API_URL}/stats/${clientId}?range=${range}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },

  getMessages: async (token: string, otherUserId: string) => {
    if (USE_MOCK_DATA) {
        const user = JSON.parse(localStorage.getItem('helix_user') || '{}');
        return mockMessages.filter(m => 
            (m.senderId === user.id && m.receiverId === otherUserId) ||
            (m.senderId === otherUserId && m.receiverId === user.id)
          ).sort((a, b) => a.timestamp - b.timestamp);
    }
    const res = await fetch(`${API_URL}/chat/${otherUserId}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },

  sendMockMessage: async (senderId: string, receiverId: string, text: string) => {
     const msg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderId,
        receiverId,
        text,
        timestamp: Date.now(),
        read: false
     };
     mockMessages.push(msg);
     return msg;
  }
};