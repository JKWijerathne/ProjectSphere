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
        password: {
            type: String,
            // All roles (Student, Lecturer, Recruiter) can use email+password login.
            // Not required at schema level because a user might only ever use Google OAuth
            // and never set a password. Required only when registering via the local
            // (email+password) route — enforced in authController/authService, not here.
            select: false, // never return password field by default in queries
        },
        googleId: {
            type: String,
            // Set when a user logs in/signs up via Google OAuth (Member 4).
            // A user can have BOTH googleId and password set if they linked both methods.
            unique: true,
            sparse: true, // allows multiple users with no googleId (local-only users)
        },
        authProviders: {
            type: [String],
            enum: ['google', 'local'],
            default: [],
            // Tracks which login method(s) this account supports.
            // e.g. ['local'] = email+password only
            //      ['google'] = Google OAuth only
            //      ['local', 'google'] = user can log in either way (same account linked)
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