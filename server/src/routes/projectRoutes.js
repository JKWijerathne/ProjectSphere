import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { 
  createProject, 
  getProjects, 
  getProjectById, 
  updateProject, 
  deleteProject, 
  getMyProjects,
  likeProject,
  addComment,
  deleteComment
} from '../controllers/projectController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { validateAddComment } from '../validations/projectValidation.js';

const projectRouter = express.Router();

const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'diagrams', maxCount: 10 },
  { name: 'dbSchema', maxCount: 1 },
  { name: 'dbSchemaUrl', maxCount: 1 }
]);

// Public routes — browse approved projects without authentication
projectRouter.get('/', optionalAuth, getProjects);

// Protected student route — must be registered before /:id
projectRouter.get('/my-projects', protect, restrictTo('Student'), getMyProjects);

projectRouter.get('/:id', optionalAuth, getProjectById);

// All routes below require JWT auth
projectRouter.use(protect);

// Student specific actions
projectRouter.post('/', restrictTo('Student'), uploadFields, createProject);
projectRouter.put('/:id', restrictTo('Student'), uploadFields, updateProject);
projectRouter.delete('/:id', restrictTo('Student'), deleteProject);

// Actions available to Student, Lecturer, and Recruiter
projectRouter.post('/:id/like', restrictTo('Student', 'Lecturer', 'Recruiter'), likeProject);
projectRouter.post('/:id/comment', restrictTo('Student', 'Lecturer', 'Recruiter'), validateAddComment, addComment);
projectRouter.delete('/:id/comment/:commentId', restrictTo('Student', 'Lecturer', 'Recruiter'), deleteComment);

export default projectRouter;