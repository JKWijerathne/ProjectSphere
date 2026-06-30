import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Import and register event listeners
import { initNotificationEvents } from './events/notificationEvents.js';
import './events/projectEvents.js';

// Initialize the event-driven notification systems
initNotificationEvents();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Basic Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

// Routes Registration
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

export default app;
