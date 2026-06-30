import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { 
  createProject, 
  getProjects, 
  getProjectById, 
  updateProject, 
  deleteProject, 
  getMyProjects,
  likeProject 
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const projectRouter = express.Router();

const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'diagrams', maxCount: 10 },
  { name: 'dbSchema', maxCount: 1 },
  { name: 'dbSchemaUrl', maxCount: 1 }
]);

// Project routes protected by JWT auth
projectRouter.use(protect);

// Student specific actions
projectRouter.post('/', restrictTo('Student'), uploadFields, createProject);
projectRouter.get('/my-projects', restrictTo('Student'), getMyProjects);
projectRouter.put('/:id', restrictTo('Student'), uploadFields, updateProject);
projectRouter.delete('/:id', restrictTo('Student'), deleteProject);

// Recruiter specific actions
projectRouter.post('/:id/like', restrictTo('Recruiter'), likeProject);

// Shared actions (Student, Lecturer, Recruiter)
projectRouter.get('/', getProjects);
projectRouter.get('/:id', getProjectById);

export default projectRouter;