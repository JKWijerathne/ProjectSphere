import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            // The user who receives the notification (e.g., the student whose project was liked)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sender: {
            // The user who triggered the event (e.g., the recruiter who clicked 'like')
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        type: {
            type: String,
            enum: [
                'ProjectCreated',
                'ProjectLiked',
                'UserFollowed',
                'ProjectApproved',
                'ProjectRejected',
            ],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        relatedProject: {
            // If the notification is about a specific project, link it here
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;