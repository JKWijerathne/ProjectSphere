import express from 'express';
import { 
  getPendingProjects, 
  approveProject, 
  rejectProject, 
  deleteProject, 
  getAdminDashboard 
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const adminRouter = express.Router();

// All admin/lecturer routes require authentication and Lecturer role
adminRouter.use(protect, restrictTo('Lecturer'));

// GET /api/admin/projects/pending - Get all pending projects
adminRouter.get('/projects/pending', getPendingProjects);

// PUT /api/admin/projects/:id/approve - Approve a project
adminRouter.put('/projects/:id/approve', approveProject);

// PUT /api/admin/projects/:id/reject - Reject a project
adminRouter.put('/api/admin/projects/:id/reject', rejectProject); // Wait! Let's register it relative to /api/admin as:
// adminRouter.put('/projects/:id/reject', rejectProject);
// Let's use the relative path so that it maps to /api/admin/projects/:id/reject:
adminRouter.put('/projects/:id/reject', rejectProject);

// DELETE /api/admin/projects/:id - Delete a project
adminRouter.delete('/projects/:id', deleteProject);

// GET /api/admin/dashboard - Fetch dashboard statistics
adminRouter.get('/dashboard', getAdminDashboard);

export default adminRouter;
