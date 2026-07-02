import express from 'express';
import { 
  getPendingProjects, 
  getApprovedProjectsByLecturer,
  approveProject, 
  rejectProject, 
  deleteProject, 
  getAdminDashboard,
  deleteUser,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const adminRouter = express.Router();

// All admin/lecturer routes require authentication and Lecturer role
adminRouter.use(protect, restrictTo('Lecturer'));

// GET /api/admin/projects/pending - Get all pending projects
adminRouter.get('/projects/pending', getPendingProjects);

// GET /api/admin/projects/approved - Get projects approved by the current lecturer
adminRouter.get('/projects/approved', getApprovedProjectsByLecturer);

// PUT /api/admin/projects/:id/approve - Approve a project
adminRouter.put('/projects/:id/approve', approveProject);

// PUT /api/admin/projects/:id/reject - Reject a project
adminRouter.put('/projects/:id/reject', rejectProject);

// DELETE /api/admin/projects/:id - Delete a project
adminRouter.delete('/projects/:id', deleteProject);

// GET /api/admin/dashboard - Fetch dashboard statistics
adminRouter.get('/dashboard', getAdminDashboard);

// DELETE /api/admin/users/:id - Delete user and all associated data
adminRouter.delete('/users/:id', deleteUser);

export default adminRouter;
