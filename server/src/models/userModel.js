import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

// Virtual field for confirming password during registration
userSchema.virtual('confirmPassword')
    .get(function() {
        return this._confirmPassword;
    })
    .set(function(value) {
        this._confirmPassword = value;
    });

// Validate that password and confirmPassword match
userSchema.pre('validate', function(next) {
    if (this.isModified('password') && this.confirmPassword !== undefined) {
        if (this.password !== this.confirmPassword) {
            this.invalidate('confirmPassword', 'Passwords do not match');
        }
    }
    next();
});

// Hash the password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Helper method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false; // If user signed up with Google OAuth only
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;