import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { User, PlanRequest, DailyTask, ChatMessage, Package } from './models.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'helix-secret-key-change-me';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/helix';

// Middleware
app.use(cors());
app.use(express.json());

// --- Auth Middleware ---
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// --- Routes ---

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await User.findOne({ email, role }).populate('activePackage');
    if (!user) {
       // Demo/Seed Logic
       if ((email === 'admin@helix.com' || email === 'doctor@helix.com') && password === 'password') {
         const newUser = await User.create({
           email, password, role: role, name: role === 'ADMIN' ? 'Dr. Helix Admin' : 'Dr. Sarah Smith', avatar: `https://ui-avatars.com/api/?name=${role}&background=random`
         });
         const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET);
         return res.json({ user: { id: newUser._id, ...newUser.toObject() }, token });
       }
       return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    const userObj = user.toObject();
    userObj.id = user._id;
    res.json({ user: userObj, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'CLIENT',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET);
    const userObj = newUser.toObject();
    userObj.id = newUser._id;
    res.json({ user: userObj, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Users
app.get('/api/users', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'ADMIN') {
        filter = {}; 
    } else if (req.user.role === 'DOCTOR') {
        filter = { role: 'CLIENT' }; 
    } else {
        filter = { role: { $in: ['ADMIN', 'DOCTOR'] } };
    }
    const users = await User.find(filter).populate('activePackage');
    res.json(users.map(u => ({ ...u.toObject(), id: u._id })));
  } catch(e) {
    res.status(500).json({message: e.message});
  }
});

app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({message: 'Admins only'});
    
    const { role, packageId, packageEndDate } = req.body;
    const updateData = {};
    if (role) updateData.role = role;
    if (packageId) updateData.activePackage = packageId;
    if (packageEndDate) updateData.packageEndDate = packageEndDate;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('activePackage');
    res.json({ ...updatedUser.toObject(), id: updatedUser._id });
  } catch (e) {
    res.status(500).json({message: e.message});
  }
});

// Packages
app.get('/api/packages', async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true });
    res.json(packages.map(p => ({ ...p.toObject(), id: p._id })));
  } catch (e) {
    res.status(500).json({message: e.message});
  }
});

app.post('/api/packages', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({message: 'Admins only'});
    const newPackage = await Package.create(req.body);
    res.json({ ...newPackage.toObject(), id: newPackage._id });
  } catch (e) {
    res.status(500).json({message: e.message});
  }
});

app.put('/api/packages/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({message: 'Admins only'});
        const updated = await Package.findByIdAndUpdate(req.params.id, req.body, {new: true});
        res.json({ ...updated.toObject(), id: updated._id });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
});

app.delete('/api/packages/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({message: 'Admins only'});
        await Package.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
});

app.post('/api/packages/subscribe', authenticate, async (req, res) => {
    try {
        const { packageId } = req.body;
        const pkg = await Package.findById(packageId);
        if (!pkg) return res.status(404).json({message: 'Package not found'});

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + pkg.durationDays);

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { activePackage: pkg._id, packageEndDate: endDate },
            { new: true }
        ).populate('activePackage');

        res.json({ user: { ...updatedUser.toObject(), id: updatedUser._id } });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
});

// Requests
app.get('/api/requests', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'CLIENT') {
        filter = { client: req.user.id };
    } else if (req.user.role === 'DOCTOR') {
        filter = { doctor: req.user.id };
    }
    // Admin sees all
    const requests = await PlanRequest.find(filter).populate('doctor', 'name').sort({requestDate: -1});
    res.json(requests.map(r => ({ 
        ...r.toObject(), 
        id: r._id, 
        clientId: r.client,
        doctorName: r.doctor?.name
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/requests', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Strict Package Check
    if (!user.activePackage) {
        return res.status(403).json({message: 'Active subscription required'});
    }
    if (new Date(user.packageEndDate) < new Date()) {
        return res.status(403).json({message: 'Subscription expired'});
    }

    const newReq = await PlanRequest.create({
      client: req.user.id,
      clientName: user.name,
      ...req.body, // detailed fields
      status: 'REQUESTED'
    });
    res.json({ ...newReq.toObject(), id: newReq._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/requests/:id/assign', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).send('Admins only');
    const { doctorId } = req.body;
    const updated = await PlanRequest.findByIdAndUpdate(
        req.params.id, 
        { doctor: doctorId, status: 'PROCESSING' }, 
        { new: true }
    ).populate('doctor', 'name');
    res.json({ ...updated.toObject(), id: updated._id, doctorName: updated.doctor?.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NEW ROUTE: Doctor Submits Draft ---
app.put('/api/requests/:id/draft', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'DOCTOR') return res.status(403).send('Doctors only');
    const { tasks } = req.body; // draftTasks array

    const updated = await PlanRequest.findByIdAndUpdate(
        req.params.id,
        { 
            draftTasks: tasks, 
            status: 'PENDING_APPROVAL' 
        },
        { new: true }
    );
    res.json({ ...updated.toObject(), id: updated._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NEW ROUTE: Admin Publishes Plan ---
app.post('/api/requests/:id/publish', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).send('Admins only');
    
    const request = await PlanRequest.findById(req.params.id);
    if (!request || !request.draftTasks) return res.status(404).send('Request or draft not found');

    const { draftTasks } = req.body; // Allow admin edits to override DB draft if passed

    const finalTasks = (draftTasks || request.draftTasks).map(t => ({
        client: request.client,
        date: t.date,
        title: t.title,
        description: t.description,
        type: t.type,
        time: t.time,
        calories: t.calories,
        status: 'PENDING'
    }));

    await DailyTask.insertMany(finalTasks);
    
    request.status = 'ACTIVE';
    request.draftTasks = []; // Clear draft after publish
    await request.save();

    res.json({ success: true, request: { ...request.toObject(), id: request._id } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tasks
app.get('/api/tasks', authenticate, async (req, res) => {
  try {
    const { clientId, date } = req.query;
    const targetId = req.user.role === 'CLIENT' ? req.user.id : clientId;
    if (!targetId) return res.json([]);

    const query = { client: targetId };
    if (date) query.date = date;

    const tasks = await DailyTask.find(query).sort({ date: 1 });
    res.json(tasks.map(t => ({ ...t.toObject(), id: t._id, clientId: t.client })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/tasks/:id/toggle', authenticate, async (req, res) => {
    try {
        const task = await DailyTask.findById(req.params.id);
        if (!task) return res.status(404).send('Not found');
        if (task.client.toString() !== req.user.id) return res.status(403).send('Unauthorized');
        
        const today = new Date().toISOString().split('T')[0];
        if (task.date !== today) {
             return res.status(400).json({ message: "Cannot modify historical tasks." });
        }

        task.status = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        await task.save();
        res.json({ ...task.toObject(), id: task._id });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
});

// Stats & Chat omitted for brevity (unchanged logic)
app.get('/api/stats/:clientId', authenticate, async (req, res) => {
    try {
      const targetId = req.user.role === 'CLIENT' ? req.user.id : req.params.clientId;
      const { range } = req.query; 
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (range === 'month' ? 30 : 6));
  
      const tasks = await DailyTask.find({
        client: targetId,
        date: { 
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        }
      });
      // ... aggregation logic
      const statsMap = {};
      tasks.forEach(task => {
        if (!statsMap[task.date]) statsMap[task.date] = { total: 0, completed: 0 };
        statsMap[task.date].total++;
        if (task.status === 'COMPLETED') statsMap[task.date].completed++;
      });
  
      const stats = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayData = statsMap[dateStr] || { total: 0, completed: 0 };
        stats.push({
          date: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
          completed: dayData.completed,
          total: dayData.total,
          rate: dayData.total > 0 ? Math.round((dayData.completed / dayData.total) * 100) : 0
        });
      }
      res.json(stats);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/chat/:userId', authenticate, async (req, res) => {
    try {
        const otherId = req.params.userId;
        const myId = req.user.id;
        const messages = await ChatMessage.find({
          $or: [{ sender: myId, receiver: otherId }, { sender: otherId, receiver: myId }]
        }).sort({ timestamp: 1 });
        res.json(messages.map(m => ({ ...m.toObject(), id: m._id, senderId: m.sender, receiverId: m.receiver })));
    } catch (err) { res.status(500).json({ message: err.message }); }
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => { socket.join(userId); });
  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text } = data;
    const newMsg = await ChatMessage.create({ sender: senderId, receiver: receiverId, text, timestamp: Date.now() });
    io.to(receiverId).emit('receive_message', { ...newMsg.toObject(), id: newMsg._id, senderId, receiverId });
    io.to(senderId).emit('message_sent', { ...newMsg.toObject(), id: newMsg._id, senderId, receiverId });
  });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Seeding Packages if empty
    Package.countDocuments().then(count => {
        if(count === 0) {
            Package.create([
                { name: 'Basic Start', durationDays: 30, price: 29.99, features: ['AI Diet Plan', 'Weekly Progress'] },
                { name: 'Premium Health', durationDays: 90, price: 79.99, features: ['AI Diet Plan', 'Daily Chat Support', 'Priority Doctor Review'] }
            ]);
        }
    });
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));