export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  DOCTOR = 'DOCTOR'
}

export enum PlanStatus {
  NONE = 'NONE',
  REQUESTED = 'REQUESTED',
  PROCESSING = 'PROCESSING', // Assigned to doctor
  ACTIVE = 'ACTIVE'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface Package {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  features: string[];
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  activePackage?: Package; // Populated package
  packageEndDate?: string;
}

export interface DailyTask {
  id: string;
  clientId: string;
  date: string; // ISO Date string YYYY-MM-DD
  title: string;
  description: string;
  type: 'MEAL' | 'ACTIVITY';
  status: TaskStatus;
  time?: string; // e.g., "08:00 AM"
}

export interface PlanRequest {
  id: string;
  clientId: string;
  clientName: string;
  doctorId?: string; // Assigned doctor
  doctorName?: string;
  status: PlanStatus;
  requestDate: string;
  
  // Detailed Health Info
  goals: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  allergies?: string;
  preferredMeals?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface ProgressStats {
  date: string; // e.g. "Mon", "Oct 12"
  completed: number;
  total: number;
  rate: number;
}