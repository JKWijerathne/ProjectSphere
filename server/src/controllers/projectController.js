import Project from '../models/projectModel.js';
import eventEmitter from '../events/eventEmitter.js';
import { uploadSingleImage, uploadMultipleImages } from '../utils/cloudinaryHelper.js';

const userLikedProject = (likes, userId) => {
    if (!userId || !Array.isArray(likes)) return false;
    const currentUserId = userId.toString();
    return likes.some((like) => (like?._id || like).toString() === currentUserId);
};

const withLikeMeta = (project, userId) => {
    const projectData = project.toObject ? project.toObject() : project;
    return {
        ...projectData,
        likedByCurrentUser: userLikedProject(projectData.likes, userId),
    };
};

// POST /projects - Create a new project (Student only)
export const createProject = async (req, res) => {
    try {
        const { title, description, technologies, category, githubUrl } = req.body;

        let thumbnail = null;
        let diagrams = [];
        let dbSchemaUrl = null;

        if (req.files) {
            if (Array.isArray(req.files)) {
                const diagramFiles = [];
                for (const file of req.files) {
                    if (file.fieldname === 'thumbnail') {
                        thumbnail = await uploadSingleImage(file, 'projectsphere/thumbnails');
                    } else if (file.fieldname === 'dbSchema' || file.fieldname === 'dbSchemaUrl') {
                        dbSchemaUrl = await uploadSingleImage(file, 'projectsphere/schemas');
                    } else if (file.fieldname === 'diagrams') {
                        diagramFiles.push(file);
                    }
                }
                if (diagramFiles.length > 0) {
                    diagrams = await uploadMultipleImages(diagramFiles, 'projectsphere/diagrams');
                }
            } else {
                if (req.files.thumbnail && req.files.thumbnail[0]) {
                    thumbnail = await uploadSingleImage(req.files.thumbnail[0], 'projectsphere/thumbnails');
                }
                if (req.files.dbSchema && req.files.dbSchema[0]) {
                    dbSchemaUrl = await uploadSingleImage(req.files.dbSchema[0], 'projectsphere/schemas');
                }
                if (req.files.diagrams && req.files.diagrams.length > 0) {
                    diagrams = await uploadMultipleImages(req.files.diagrams, 'projectsphere/diagrams');
                }
            }
        } else if (req.file) {
            thumbnail = await uploadSingleImage(req.file, 'projectsphere/thumbnails');
        }

        const project = await Project.create({
            title,
            description,
            technologies: technologies ? (typeof technologies === 'string' ? technologies.split(',') : technologies) : [],
            category,
            githubUrl,
            thumbnail,
            diagrams,
            dbSchemaUrl,
            owner: req.user._id, // comes from auth middleware
            status: 'Pending'
        });

        // Emit ProjectCreated event to notify Lecturers/Admins
        eventEmitter.emit('ProjectCreated', { project, sender: req.user });

        res.status(201).json({ success: true, project });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /projects - Get all approved public projects
export const getProjects = async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = { status: 'Approved' };

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        if (category) {
            query.category = category;
        }

        const projects = await Project.find(query)
            .populate('owner', 'name email profilePicture') // show owner details
            .sort({ createdAt: -1 }); // newest first

        const userId = req.user?._id;
        res.json({
            success: true,
            projects: projects.map((project) => withLikeMeta(project, userId)),
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /projects/:id - Get single project
export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email profilePicture')
            .populate('likes', 'name email')
            .populate('comments.user', 'name profilePicture');

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        res.json({
            success: true,
            project: withLikeMeta(project, req.user?._id),
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// PUT /projects/:id - Update project (Owner Student only)
export const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Only owner can edit
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        const { title, description, technologies, category, githubUrl } = req.body;

        let thumbnail = project.thumbnail;
        let diagrams = project.diagrams || [];
        let dbSchemaUrl = project.dbSchemaUrl;

        if (req.files) {
            if (Array.isArray(req.files)) {
                const diagramFiles = [];
                for (const file of req.files) {
                    if (file.fieldname === 'thumbnail') {
                        thumbnail = await uploadSingleImage(file, 'projectsphere/thumbnails');
                    } else if (file.fieldname === 'dbSchema' || file.fieldname === 'dbSchemaUrl') {
                        dbSchemaUrl = await uploadSingleImage(file, 'projectsphere/schemas');
                    } else if (file.fieldname === 'diagrams') {
                        diagramFiles.push(file);
                    }
                }
                if (diagramFiles.length > 0) {
                    diagrams = await uploadMultipleImages(diagramFiles, 'projectsphere/diagrams');
                }
            } else {
                if (req.files.thumbnail && req.files.thumbnail[0]) {
                    thumbnail = await uploadSingleImage(req.files.thumbnail[0], 'projectsphere/thumbnails');
                }
                if (req.files.dbSchema && req.files.dbSchema[0]) {
                    dbSchemaUrl = await uploadSingleImage(req.files.dbSchema[0], 'projectsphere/schemas');
                }
                if (req.files.diagrams && req.files.diagrams.length > 0) {
                    diagrams = await uploadMultipleImages(req.files.diagrams, 'projectsphere/diagrams');
                }
            }
        } else if (req.file) {
            thumbnail = await uploadSingleImage(req.file, 'projectsphere/thumbnails');
        }

        // Reset to Pending when edited
        const updated = await Project.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                technologies: technologies ? (typeof technologies === 'string' ? technologies.split(',') : technologies) : project.technologies,
                category,
                githubUrl,
                thumbnail,
                diagrams,
                dbSchemaUrl,
                status: 'Pending' // goes back to pending after edit
            },
            { new: true }
        );

        res.json({ success: true, project: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// DELETE /projects/:id - Delete project (Owner Student only)
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Only owner can delete
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        await project.deleteOne();
        res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /my-projects - Get logged in student's projects
export const getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({ owner: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, projects });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /projects/:id/like - Like/Unlike a project
export const likeProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const likeIndex = project.likes.findIndex(
            (id) => id.toString() === req.user._id.toString()
        );
        let liked = false;

        if (likeIndex === -1) {
            // Like project
            project.likes.push(req.user._id);
            await project.save();
            liked = true;

            // Emit ProjectLiked event (the event handler in notificationEvents will save the Notification)
            eventEmitter.emit('ProjectLiked', { project, sender: req.user });
        } else {
            // Unlike project
            project.likes.splice(likeIndex, 1);
            await project.save();
            liked = false;
        }

        res.json({ success: true, liked, likesCount: project.likes.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /projects/:id/comment - Add comment (Student, Lecturer, Recruiter)
export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const newComment = {
            text,
            user: req.user._id
        };

        project.comments.push(newComment);
        await project.save();

        // Get the populated comment
        const updatedProject = await Project.findById(req.params.id)
            .populate('comments.user', 'name profilePicture role');

        const savedComment = updatedProject.comments[updatedProject.comments.length - 1];

        // Emit ProjectCommented event to trigger notification
        eventEmitter.emit('ProjectCommented', { project, sender: req.user, comment: savedComment });

        res.status(201).json({ success: true, comment: savedComment, comments: updatedProject.comments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// DELETE /projects/:id/comment/:commentId - Delete comment
export const deleteComment = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const comment = project.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }

        // Only comment author or project owner can delete comment
        if (comment.user.toString() !== req.user._id.toString() && project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
        }

        comment.deleteOne();
        await project.save();

        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};