import Project from '../models/projectModel.js';
import User from '../models/userModel.js';
import eventEmitter from '../events/eventEmitter.js';

/**
 * GET /admin/projects/pending - Get all pending projects (Lecturer/Admin only)
 */
export const getPendingProjects = async (req, res) => {
    try {
        const pendingProjects = await Project.find({ status: 'Pending' })
            .populate('owner', 'name email profilePicture')
            .sort({ createdAt: -1 });

        res.json({ success: true, projects: pendingProjects });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PUT /admin/projects/:id/approve - Approve a project (Lecturer/Admin only)
 */
export const approveProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        project.status = 'Approved';
        await project.save();

        // Emit ProjectApproved event (event handler in notificationEvents will save the Notification)
        eventEmitter.emit('ProjectApproved', { project, sender: req.user });

        res.json({ success: true, message: 'Project approved successfully', project });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PUT /admin/projects/:id/reject - Reject a project (Lecturer/Admin only)
 */
export const rejectProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        project.status = 'Rejected';
        await project.save();

        // Emit ProjectRejected event
        eventEmitter.emit('ProjectRejected', { project, sender: req.user });

        res.json({ success: true, message: 'Project rejected successfully', project });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * DELETE /admin/projects/:id - Delete project (Lecturer/Admin only)
 */
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        await project.deleteOne();
        res.json({ success: true, message: 'Project deleted successfully by Administrator' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /admin/dashboard - General statistics for lecturer dashboard (Lecturer/Admin only)
 */
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

        res.json({
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
        res.status(500).json({ success: false, error: error.message });
    }
};
