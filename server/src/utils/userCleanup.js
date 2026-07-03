import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Project from '../models/projectModel.js';
import Notification from '../models/notificationModel.js';
import PendingRegistration from '../models/pendingRegistration.js';

const getUserIdReferences = (userId) => {
  const userIdString = userId?.toString();
  if (!userIdString) {
    throw new Error('User id is required for account cleanup');
  }

  const references = [userIdString];
  if (mongoose.Types.ObjectId.isValid(userIdString)) {
    references.unshift(new mongoose.Types.ObjectId(userIdString));
  }

  return references;
};

/**
 * Remove all data associated with a user before deleting their account.
 */
export async function removeAllUserData(userId, userEmail) {
  const userReferences = getUserIdReferences(userId);
  const userReferenceFilter = { $in: userReferences };

  const ownedProjects = await Project.find({ owner: userReferenceFilter }, '_id').lean();
  const ownedProjectIds = ownedProjects.map((project) => project._id);

  const notificationResult = await Notification.deleteMany({
    $or: [
      { recipient: userReferenceFilter },
      { sender: userReferenceFilter },
      ...(ownedProjectIds.length ? [{ relatedProject: { $in: ownedProjectIds } }] : []),
    ],
  });

  const deletedProjectsResult = await Project.deleteMany({ owner: userReferenceFilter });

  const likedProjectsResult = await Project.updateMany(
    { likes: userReferenceFilter },
    { $pull: { likes: userReferenceFilter } }
  );

  const commentedProjectsResult = await Project.updateMany(
    { 'comments.user': userReferenceFilter },
    { $pull: { comments: { user: userReferenceFilter } } }
  );

  const approvedProjectsResult = await Project.updateMany(
    { approvedBy: userReferenceFilter },
    { $unset: { approvedBy: '', approvedAt: '' } }
  );

  const socialUsersResult = await User.updateMany(
    {
      $or: [
        { followers: userReferenceFilter },
        { following: userReferenceFilter },
      ],
    },
    {
      $pull: {
        followers: userReferenceFilter,
        following: userReferenceFilter,
      },
    }
  );

  let pendingRegistrationResult = { deletedCount: 0 };
  if (userEmail) {
    pendingRegistrationResult = await PendingRegistration.deleteOne({ email: userEmail });
  }

  const deletedUserResult = await User.deleteOne({ _id: userReferenceFilter });

  return {
    deletedUsers: deletedUserResult.deletedCount || 0,
    deletedProjects: deletedProjectsResult.deletedCount || 0,
    deletedNotifications: notificationResult.deletedCount || 0,
    deletedPendingRegistrations: pendingRegistrationResult.deletedCount || 0,
    updatedProjectsWithRemovedLikes: likedProjectsResult.modifiedCount || 0,
    updatedProjectsWithRemovedComments: commentedProjectsResult.modifiedCount || 0,
    updatedProjectsWithRemovedApprover: approvedProjectsResult.modifiedCount || 0,
    updatedSocialUsers: socialUsersResult.modifiedCount || 0,
  };
}

/**
 * Remove likes, comments, follows, and notifications that reference deleted users.
 */
export async function cleanupOrphanedUserReferences() {
  const users = await User.find({}, '_id').lean();
  const validUserIds = new Set(users.map((user) => user._id.toString()));

  const projects = await Project.find({
    $or: [
      { likes: { $exists: true, $not: { $size: 0 } } },
      { 'comments.0': { $exists: true } },
    ],
  });

  let updatedProjects = 0;

  for (const project of projects) {
    const cleanLikes = project.likes.filter((id) => validUserIds.has(id.toString()));
    const cleanComments = project.comments.filter((comment) => validUserIds.has(comment.user.toString()));

    const likesChanged = cleanLikes.length !== project.likes.length;
    const commentsChanged = cleanComments.length !== project.comments.length;

    if (likesChanged || commentsChanged) {
      project.likes = cleanLikes;
      project.comments = cleanComments;
      await project.save();
      updatedProjects += 1;
    }
  }

  const socialUsers = await User.find({
    $or: [
      { followers: { $exists: true, $not: { $size: 0 } } },
      { following: { $exists: true, $not: { $size: 0 } } },
    ],
  });

  let updatedUsers = 0;

  for (const user of socialUsers) {
    const cleanFollowers = user.followers.filter((id) => validUserIds.has(id.toString()));
    const cleanFollowing = user.following.filter((id) => validUserIds.has(id.toString()));

    if (
      cleanFollowers.length !== user.followers.length
      || cleanFollowing.length !== user.following.length
    ) {
      user.followers = cleanFollowers;
      user.following = cleanFollowing;
      await user.save();
      updatedUsers += 1;
    }
  }

  const userIds = users.map((user) => user._id);
  const validProjectIds = (await Project.find({}, '_id').lean()).map((project) => project._id);

  const notificationResult = await Notification.deleteMany({
    $or: [
      { recipient: { $nin: userIds } },
      { sender: { $ne: null, $nin: userIds } },
      { relatedProject: { $ne: null, $nin: validProjectIds } },
    ],
  });

  return {
    updatedProjects,
    updatedUsers,
    deletedNotifications: notificationResult.deletedCount || 0,
  };
}
