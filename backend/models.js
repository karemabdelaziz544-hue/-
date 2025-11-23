import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  durationDays: { type: Number, required: true },
  price: { type: Number, required: true },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'CLIENT', 'DOCTOR'], required: true },
  avatar: { type: String },
  activePackage: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', default: null },
  packageEndDate: { type: Date }
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const planRequestSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned Doctor
  status: { type: String, enum: ['NONE', 'REQUESTED', 'PROCESSING', 'ACTIVE'], default: 'REQUESTED' },
  requestDate: { type: Date, default: Date.now },
  
  // Detailed Form Data
  goals: { type: String, required: true },
  currentWeight: Number,
  targetWeight: Number,
  height: Number,
  age: Number,
  gender: String,
  activityLevel: String,
  allergies: String,
  preferredMeals: String
});

const dailyTaskSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['MEAL', 'ACTIVITY'], required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED'], default: 'PENDING' },
  time: { type: String }
});

const chatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
  read: { type: Boolean, default: false }
});

export const User = mongoose.model('User', userSchema);
export const Package = mongoose.model('Package', packageSchema);
export const PlanRequest = mongoose.model('PlanRequest', planRequestSchema);
export const DailyTask = mongoose.model('DailyTask', dailyTaskSchema);
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);