import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        googleId: {
            type: String,
            // Required for Member 4's Google OAuth implementation
            unique: true,
            sparse: true,
        },
        profilePicture: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            enum: ['Student', 'Lecturer', 'Recruiter'],
            default: 'Student', // Defaults to Student unless specified otherwise
            required: true,
        },
        // Supporting Member 3 & Member 6: Follow system for Recruiters and Students
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;