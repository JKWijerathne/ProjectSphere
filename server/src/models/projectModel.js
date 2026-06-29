import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    technologies: [{ type: String }],

    thumbnail: { type: String },
    diagrams: [{ type: String }],
    dbSchemaUrl: { type: String },

    category: { type: String },
    githubUrl: { type: String },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],

    comments: [commentSchema]

}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;