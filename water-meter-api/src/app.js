import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import deviceRoutes from './routes/device.routes.js';
import alarmRoutes from './routes/alarm.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

console.log("cwd:", process.cwd());
console.log("dotenv DB_USER:", process.env.DB_USER);
console.log("dotenv DB_HOST:", process.env.DB_HOST);
console.log("dotenv DB_NAME:", process.env.DB_NAME);

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Water Meter API is running!',
    version: '1.0.1',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
