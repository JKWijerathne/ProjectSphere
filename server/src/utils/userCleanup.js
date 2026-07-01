import User from '../models/userModel.js';
import Project from '../models/projectModel.js';
import Notification from '../models/notificationModel.js';
import PendingRegistration from '../models/pendingRegistration.js';

/**
 * Remove all data associated with a user before deleting their account.
 */
export async function removeAllUserData(userId, userEmail) {
  const ownedProjects = await Project.find({ owner: userId }, '_id').lean();
  const ownedProjectIds = ownedProjects.map((project) => project._id);

  await Notification.deleteMany({
    $or: [
      { recipient: userId },
      { sender: userId },
      ...(ownedProjectIds.length ? [{ relatedProject: { $in: ownedProjectIds } }] : []),
    ],
  });

  await Project.deleteMany({ owner: userId });

  await Project.updateMany(
    { likes: userId },
    { $pull: { likes: userId } }
  );

  await Project.updateMany(
    { 'comments.user': userId },
    { $pull: { comments: { user: userId } } }
  );

  await User.updateMany(
    {},
    { $pull: { followers: userId, following: userId } }
  );

  if (userEmail) {
    await PendingRegistration.deleteOne({ email: userEmail });
  }

  await User.deleteOne({ _id: userId });
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
