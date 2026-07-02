// Admin controller - handles user and project management
import User from '../models/userModel.js';
import Project from '../models/projectModel.js';
import Notification from '../models/notificationModel.js';
import eventEmitter from '../events/eventEmitter.js';
import { sendResponse, sendError } from '../utils/response.js';
import { removeAllUserData } from '../utils/userCleanup.js';

const getDecisionMessage = (body = {}, status) => {
  const candidates = status === 'Approved'
    ? [body.approvalMessage, body.message, body.feedback]
    : [body.rejectionMessage, body.rejectionReason, body.reason, body.message, body.feedback];

  const customMessage = candidates.find((value) => typeof value === 'string' && value.trim());
  if (customMessage) return customMessage.trim();

  return status === 'Approved'
    ? 'Your project has been approved. It is now visible to recruiters and other ProjectSphere users.'
    : 'Your project was rejected. Please review the feedback from your lecturer and update your submission before trying again.';
};

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

    await removeAllUserData(user._id, user.email);

    sendResponse(res, 200, {
      success: true,
      message: 'User account and all associated likes, comments, and projects deleted successfully'
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

// Get pending projects (convenience endpoint)
export const getPendingProjects = async (req, res) => {
  try {
    const pendingProjects = await Project.find({ status: 'Pending' })
      .populate('owner', 'name email profilePicture')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, { success: true, projects: pendingProjects });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get projects approved by the current lecturer
export const getApprovedProjectsByLecturer = async (req, res) => {
  try {
    const approvalNotifications = await Notification.find({
      type: 'ProjectApproved',
      sender: req.user._id,
      relatedProject: { $ne: null }
    })
      .select('relatedProject createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const approvedAtByProjectId = new Map();
    approvalNotifications.forEach((notification) => {
      const projectId = notification.relatedProject?.toString();
      if (projectId && !approvedAtByProjectId.has(projectId)) {
        approvedAtByProjectId.set(projectId, notification.createdAt);
      }
    });

    const legacyApprovedProjectIds = [...approvedAtByProjectId.keys()];

    if (legacyApprovedProjectIds.length > 0) {
      await Promise.all(
        legacyApprovedProjectIds.map((projectId) => Project.updateOne(
          {
            _id: projectId,
            status: 'Approved',
            $or: [
              { approvedBy: { $exists: false } },
              { approvedBy: null }
            ]
          },
          {
            $set: {
              approvedBy: req.user._id,
              approvedAt: approvedAtByProjectId.get(projectId) || new Date()
            }
          }
        ))
      );
    }

    const approvedProjects = await Project.find({
      status: 'Approved',
      $or: [
        { approvedBy: req.user._id },
        { _id: { $in: legacyApprovedProjectIds } }
      ]
    })
      .populate('owner', 'name email profilePicture')
      .populate('approvedBy', 'name email')
      .sort({ approvedAt: -1, updatedAt: -1 });

    sendResponse(res, 200, { success: true, projects: approvedProjects });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Update project status (Approve/Reject) - generic endpoint
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

    const project = await Project.findById(req.params.id).populate('owner', 'name email');

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    const previousStatus = project.status;

    if (status === 'Approved') {
      if (previousStatus === 'Approved' && project.approvedBy) {
        return sendResponse(res, 200, {
          success: true,
          message: 'Project is already approved',
          project
        });
      }

      project.status = 'Approved';
      project.approvedBy = req.user._id;
      project.approvedAt = new Date();
    } else {
      project.status = status;
    }

    if (status !== 'Approved' && previousStatus === 'Approved') {
      project.approvedBy = undefined;
      project.approvedAt = undefined;
    }

    await project.save();

    const decisionMessage = getDecisionMessage(req.body, status);

    // Emit events for Approved/Rejected to notify owner
    if (previousStatus !== status && status === 'Approved') {
      eventEmitter.emit('ProjectApproved', { project, sender: req.user, decisionMessage });
    } else if (previousStatus !== status && status === 'Rejected') {
      eventEmitter.emit('ProjectRejected', { project, sender: req.user, decisionMessage });
    }

    sendResponse(res, 200, {
      success: true,
      message: `Project ${status.toLowerCase()} successfully`,
      project
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Approve project (explicit endpoint)
export const approveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email');

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    const previousStatus = project.status;
    if (previousStatus === 'Approved' && project.approvedBy) {
      return sendResponse(res, 200, {
        success: true,
        message: 'Project is already approved',
        project
      });
    }

    project.status = 'Approved';
    project.approvedBy = req.user._id;
    project.approvedAt = new Date();
    await project.save();

    const decisionMessage = getDecisionMessage(req.body, 'Approved');

    // Emit ProjectApproved event
    if (previousStatus !== 'Approved') {
      eventEmitter.emit('ProjectApproved', { project, sender: req.user, decisionMessage });
    }

    sendResponse(res, 200, { success: true, message: 'Project approved successfully', project });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Reject project (explicit endpoint)
export const rejectProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email');

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    const previousStatus = project.status;
    project.status = 'Rejected';
    project.approvedBy = undefined;
    project.approvedAt = undefined;
    await project.save();

    const decisionMessage = getDecisionMessage(req.body, 'Rejected');

    // Emit ProjectRejected event
    if (previousStatus !== 'Rejected') {
      eventEmitter.emit('ProjectRejected', { project, sender: req.user, decisionMessage });
    }

    sendResponse(res, 200, { success: true, message: 'Project rejected successfully', project });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Delete project (admin can delete any project) - keep admin-specific name
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

// Delete project (alias endpoint used by some routes) - kept to match incoming branch behavior
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    await project.deleteOne();
    sendResponse(res, 200, { success: true, message: 'Project deleted successfully by Administrator' });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get dashboard statistics (dev version)
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

// Get admin dashboard (incoming branch) - includes recent projects
export const getAdminDashboard = async (req, res) => {
  try {
    const [
      studentCount,
      recruiterCount,
      approvedCount,
      pendingCount,
      rejectedCount,
      recentProjects
    ] = await Promise.all([
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Recruiter' }),
      Project.countDocuments({ status: 'Approved' }),
      Project.countDocuments({ status: 'Pending' }),
      Project.countDocuments({ status: 'Rejected' }),
      Project.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('owner', 'name email')
    ]);

    sendResponse(res, 200, {
      success: true,
      stats: {
        totalUsers: {
          students: studentCount,
          recruiters: recruiterCount,
          total: studentCount + recruiterCount
        },
        projects: {
          approved: approvedCount,
          pending: pendingCount,
          rejected: rejectedCount,
          total: approvedCount + pendingCount + rejectedCount
        }
      },
      recentProjects
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
