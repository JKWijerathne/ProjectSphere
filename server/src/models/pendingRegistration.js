import mongoose from 'mongoose';

const pendingRegistrationSchema = new mongoose.Schema(
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
            select: false,
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        authProviders: {
            type: [String],
            enum: ['google', 'local'],
            default: [],
        },

        profilePicture: {
            type: String,
            default: '',
        },

        role: {
            type: String,
            enum: ['Student', 'Lecturer', 'Recruiter'],
            default: 'Student',
            required: true,
        },

        // OTP Verification
        otpHash: {
            type: String,
            required: true,
            select: false,
        },

        otpExpiresAt: {
            type: Date,
            required: true,
        },

        otpAttempts: {
            type: Number,
            default: 0,
        },

        // MongoDB TTL Index
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
    },
    { timestamps: true }
);

const PendingRegistration = mongoose.model(
    'PendingRegistration',
    pendingRegistrationSchema
);

export default PendingRegistration;