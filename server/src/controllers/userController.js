import User from '../models/userModel.js';
import eventEmitter from '../events/eventEmitter.js';

/**
 * POST /users/:id/follow - Follow/Unfollow a user (e.g. Recruiter follows Student)
 */
export const followUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user._id;

        // Prevent self-following
        if (targetUserId.toString() === currentUserId.toString()) {
            return res.status(400).json({ success: false, error: 'You cannot follow yourself' });
        }

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const isFollowing = currentUser.following.includes(targetUserId);
        let followed = false;

        if (!isFollowing) {
            // Follow
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);
            
            await currentUser.save();
            await targetUser.save();
            followed = true;

            // Emit UserFollowed event
            eventEmitter.emit('UserFollowed', { followedUser: targetUser, follower: currentUser });
        } else {
            // Unfollow
            currentUser.following = currentUser.following.filter(
                id => id.toString() !== targetUserId.toString()
            );
            targetUser.followers = targetUser.followers.filter(
                id => id.toString() !== currentUserId.toString()
            );
            
            await currentUser.save();
            await targetUser.save();
            followed = false;
        }

        res.json({ 
            success: true, 
            followed, 
            followersCount: targetUser.followers.length,
            followingCount: currentUser.following.length 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
