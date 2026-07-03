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
            // Password is optional at schema level because users can sign up with Google OAuth only
            // Required only when registering via local (email+password) route
            // Validation enforced in authController and authValidation middleware
            select: false, // Never return password field by default in queries
        },
        googleId: {
            type: String,
            // Set when user logs in/signs up via Google OAuth
            // A user can have BOTH googleId and password if they link both methods
            unique: true,
            sparse: true, // Allows multiple users with no googleId (local-only users)
        },
        authProviders: {
            type: [String],
            enum: ['google', 'local'],
            default: [],
            // Tracks which login method(s) this account supports
            // ['local'] = email+password only
            // ['google'] = Google OAuth only
            // ['local', 'google'] = both methods linked
        },
        profilePicture: {
            type: String,
            default: '',
        },
        passwordResetToken: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },
        role: {
            type: String,
            enum: ['Student', 'Lecturer', 'Recruiter'],
            default: 'Student',
            required: true,
        },
        // Follow system for social features
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
