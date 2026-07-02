import eventEmitter from './eventEmitter.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import { sendProjectDecisionEmail } from '../utils/emailService.js';

const getProjectOwner = async (project) => {
    if (project.owner?.email) {
        return project.owner;
    }

    const ownerId = project.owner?._id || project.owner;
    if (!ownerId) {
        return null;
    }

    return User.findById(ownerId).select('name email');
};

/**
 * Initialize all application event listeners that generate notifications.
 */
export const initNotificationEvents = () => {
    // 1. ProjectCreated Event (Notify all Lecturers)
    eventEmitter.on('ProjectCreated', async ({ project, sender }) => {
        try {
            // Find all lecturers/admins
            const lecturers = await User.find({ role: 'Lecturer' });
            
            const promises = lecturers.map((lecturer) => {
                return Notification.create({
                    recipient: lecturer._id,
                    sender: sender._id,
                    type: 'ProjectCreated',
                    message: `A new project "${project.title}" has been submitted for approval by ${sender.name}.`,
                    relatedProject: project._id,
                });
            });

            await Promise.all(promises);
            console.log(`[Event Log] ProjectCreated notification created for ${lecturers.length} lecturers.`);
        } catch (error) {
            console.error('Error handling ProjectCreated notification:', error);
        }
    });

    // 2. ProjectLiked Event (Notify Student/Owner)
    eventEmitter.on('ProjectLiked', async ({ project, sender }) => {
        try {
            // Don't notify if the user likes their own project
            if (project.owner.toString() === sender._id.toString()) return;

            await Notification.create({
                recipient: project.owner,
                sender: sender._id,
                type: 'ProjectLiked',
                message: `${sender.name} liked your project "${project.title}".`,
                relatedProject: project._id,
            });
            console.log('[Event Log] ProjectLiked notification created.');
        } catch (error) {
            console.error('Error handling ProjectLiked notification:', error);
        }
    });

    // 3. UserFollowed Event (Notify Followed User)
    eventEmitter.on('UserFollowed', async ({ followedUser, follower }) => {
        try {
            await Notification.create({
                recipient: followedUser._id,
                sender: follower._id,
                type: 'UserFollowed',
                message: `${follower.name} started following you.`,
            });
            console.log('[Event Log] UserFollowed notification created.');
        } catch (error) {
            console.error('Error handling UserFollowed notification:', error);
        }
    });

    // 4. ProjectApproved Event (Notify Student/Owner)
    eventEmitter.on('ProjectApproved', async ({ project, sender, decisionMessage }) => {
        try {
            const owner = await getProjectOwner(project);

            await Notification.create({
                recipient: owner?._id || project.owner,
                sender: sender._id,
                type: 'ProjectApproved',
                message: decisionMessage
                    ? `Your project "${project.title}" has been approved. Message: ${decisionMessage}`
                    : `Your project "${project.title}" has been approved.`,
                relatedProject: project._id,
            });

            if (owner?.email) {
                await sendProjectDecisionEmail({
                    to: owner.email,
                    studentName: owner.name,
                    projectTitle: project.title,
                    status: 'Approved',
                    message: decisionMessage,
                    lecturerName: sender.name
                });
            }

            console.log('[Event Log] ProjectApproved notification created.');
        } catch (error) {
            console.error('Error handling ProjectApproved notification:', error);
        }
    });

    // 5. ProjectRejected Event (Notify Student/Owner)
    eventEmitter.on('ProjectRejected', async ({ project, sender, decisionMessage }) => {
        try {
            const owner = await getProjectOwner(project);

            await Notification.create({
                recipient: owner?._id || project.owner,
                sender: sender._id,
                type: 'ProjectRejected',
                message: decisionMessage
                    ? `Your project "${project.title}" has been rejected. Message: ${decisionMessage}`
                    : `Your project "${project.title}" has been rejected.`,
                relatedProject: project._id,
            });

            if (owner?.email) {
                await sendProjectDecisionEmail({
                    to: owner.email,
                    studentName: owner.name,
                    projectTitle: project.title,
                    status: 'Rejected',
                    message: decisionMessage,
                    lecturerName: sender.name
                });
            }

            console.log('[Event Log] ProjectRejected notification created.');
        } catch (error) {
            console.error('Error handling ProjectRejected notification:', error);
        }
    });

    // 6. ProjectCommented Event (Notify Student/Owner)
    eventEmitter.on('ProjectCommented', async ({ project, sender, comment }) => {
        try {
            // Don't notify if the user comments on their own project
            if (project.owner.toString() === sender._id.toString()) return;

            await Notification.create({
                recipient: project.owner,
                sender: sender._id,
                type: 'ProjectCommented',
                message: `${sender.name} commented on your project "${project.title}": "${comment.text.substring(0, 30)}..."`,
                relatedProject: project._id,
            });
            console.log('[Event Log] ProjectCommented notification created.');
        } catch (error) {
            console.error('Error handling ProjectCommented notification:', error);
        }
    });
};
