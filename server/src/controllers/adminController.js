// Admin controller - handles user and project management
import User from '../models/userModel.js';
import Project from '../models/projectModel.js';
import { sendResponse, sendError } from '../utils/response.js';

// Get all users with optional filters
export const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    // Filter by role if provided
    if (role) {
      if (!['Student', 'Lecturer', 'Recruiter'].includes(role)) {
        return sendError(res, 'Invalid role', 400);
      }
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Find users and exclude password
    const users = await User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, {
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    // Find user
    const user = await User.findById(req.params.id).select('-password -__v');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendResponse(res, 200, {
      success: true,
      user
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!['Student', 'Lecturer', 'Recruiter'].includes(role)) {
      return sendError(res, 'Invalid role. Must be Student, Lecturer, or Recruiter', 400);
    }

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot change your own role', 403);
    }

    // Update user role
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendResponse(res, 200, {
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot delete your own account', 403);
    }

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Delete all projects owned by this user
    await Project.deleteMany({ owner: user._id });

    // Delete user
    await user.deleteOne();

    sendResponse(res, 200, {
      success: true,
      message: 'User and associated projects deleted successfully'
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get all projects (including pending/rejected)
export const getAllProjects = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = {};

    // Filter by status
    if (status) {
      if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return sendError(res, 'Invalid status', 400);
      }
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Find projects and populate owner
    const projects = await Project.find(query)
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, {
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Update project status (Approve/Reject)
export const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return sendError(res, 'Invalid status. Must be Pending, Approved, or Rejected', 400);
    }

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid project ID format', 400);
    }

    // Update project status
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    // TODO: Create notification for project owner (Member 6 will implement)
    // if (status === 'Approved') {
    //   eventEmitter.emit('ProjectApproved', project);
    // } else if (status === 'Rejected') {
    //   eventEmitter.emit('ProjectRejected', project);
    // }

    sendResponse(res, 200, {
      success: true,
      message: `Project ${status.toLowerCase()} successfully`,
      project
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Delete project (admin can delete any project)
export const deleteProjectAdmin = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid project ID format', 400);
    }

    // Find and delete project
    const project = await Project.findById(req.params.id);
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    await project.deleteOne();

    sendResponse(res, 200, {
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Count users by role
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalRecruiters = await User.countDocuments({ role: 'Recruiter' });
    const totalLecturers = await User.countDocuments({ role: 'Lecturer' });

    // Count projects by status
    const totalProjects = await Project.countDocuments();
    const pendingProjects = await Project.countDocuments({ status: 'Pending' });
    const approvedProjects = await Project.countDocuments({ status: 'Approved' });
    const rejectedProjects = await Project.countDocuments({ status: 'Rejected' });

    sendResponse(res, 200, {
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          recruiters: totalRecruiters,
          lecturers: totalLecturers
        },
        projects: {
          total: totalProjects,
          pending: pendingProjects,
          approved: approvedProjects,
          rejected: rejectedProjects
        }
      }
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
