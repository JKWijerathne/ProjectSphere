import express from 'express';
import { getPublicStats } from '../controllers/statsController.js';

const statsRouter = express.Router();

statsRouter.get('/', getPublicStats);

export default statsRouter;
