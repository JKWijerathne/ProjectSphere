import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createProject, getProjects, getProjectById, updateProject, deleteProject, getMyProjects } from '../controllers/projectController.js';

const projectRouter = express.Router();

// Ensure upload directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up disk storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'diagrams', maxCount: 10 },
  { name: 'dbSchema', maxCount: 1 },
  { name: 'dbSchemaUrl', maxCount: 1 }
]);

projectRouter.post('/', uploadFields, createProject);
projectRouter.get('/', getProjects);
projectRouter.get('/my-projects', getMyProjects);
projectRouter.get('/:id', getProjectById);
projectRouter.put('/:id', uploadFields, updateProject);
projectRouter.delete('/:id', deleteProject);
export default projectRouter;