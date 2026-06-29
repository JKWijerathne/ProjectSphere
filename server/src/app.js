import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes.js'


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Basic Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});
app.use('/api/projects',projectRoutes);


export default app;

