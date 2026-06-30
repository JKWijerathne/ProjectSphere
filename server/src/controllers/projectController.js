import Project from '../models/projectModel.js';
import eventEmitter from '../events/eventEmitter.js';

// POST /projects - Create a new project (Student only)
export const createProject = async (req, res) => {
    try {
        const { title, description, technologies, category, githubUrl } = req.body;

        let thumbnail = null;
        let diagrams = [];
        let dbSchemaUrl = null;

        if (req.files) {
            if (Array.isArray(req.files)) {
                req.files.forEach(file => {
                    if (file.fieldname === 'thumbnail') {
                        thumbnail = file.path;
                    } else if (file.fieldname === 'dbSchema' || file.fieldname === 'dbSchemaUrl') {
                        dbSchemaUrl = file.path;
                    } else if (file.fieldname === 'diagrams') {
                        diagrams.push(file.path);
                    }
                });
            } else {
                if (req.files.thumbnail && req.files.thumbnail[0]) {
                    thumbnail = req.files.thumbnail[0].path;
                }
                if (req.files.dbSchema && req.files.dbSchema[0]) {
                    dbSchemaUrl = req.files.dbSchema[0].path;
                }
                if (req.files.diagrams) {
                    diagrams = req.files.diagrams.map(file => file.path);
                }
            }
        } else if (req.file) {
            thumbnail = req.file.path;
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

        res.json({ success: true, projects });
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

        res.json({ success: true, project });
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
                const uploadedDiagrams = [];
                req.files.forEach(file => {
                    if (file.fieldname === 'thumbnail') {
                        thumbnail = file.path;
                    } else if (file.fieldname === 'dbSchema' || file.fieldname === 'dbSchemaUrl') {
                        dbSchemaUrl = file.path;
                    } else if (file.fieldname === 'diagrams') {
                        uploadedDiagrams.push(file.path);
                    }
                });
                if (uploadedDiagrams.length > 0) {
                    diagrams = uploadedDiagrams;
                }
            } else {
                if (req.files.thumbnail && req.files.thumbnail[0]) {
                    thumbnail = req.files.thumbnail[0].path;
                }
                if (req.files.dbSchema && req.files.dbSchema[0]) {
                    dbSchemaUrl = req.files.dbSchema[0].path;
                }
                if (req.files.diagrams) {
                    diagrams = req.files.diagrams.map(file => file.path);
                }
            }
        } else if (req.file) {
            thumbnail = req.file.path;
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

// POST /projects/:id/like - Like/Unlike a project (Recruiter only)
export const likeProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const likeIndex = project.likes.indexOf(req.user._id);
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