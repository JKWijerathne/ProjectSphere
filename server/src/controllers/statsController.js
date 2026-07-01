import User from '../models/userModel.js';
import Project from '../models/projectModel.js';
import { sendResponse, sendError } from '../utils/response.js';

export const getPublicStats = async (req, res) => {
  try {
    const [projects, pending, recruiters] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'Pending' }),
      User.countDocuments({ role: 'Recruiter' }),
    ]);

    sendResponse(res, 200, {
      success: true,
      stats: { projects, pending, recruiters },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
