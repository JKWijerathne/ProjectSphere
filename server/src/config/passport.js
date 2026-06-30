import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true, // Trust proxy if behind one (e.g., Heroku)
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Log OAuth profile for debugging (remove in production)
        console.log('Google OAuth Profile:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
        });

        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if user exists with the same email (link accounts)
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.profilePicture = profile.photos[0]?.value || user.profilePicture;
            
            // Add 'google' to authProviders if not already present
            if (!user.authProviders.includes('google')) {
              user.authProviders.push('google');
            }
            
            await user.save();
            console.log('Linked Google account to existing user:', user.email);
          } else {
            // Create new user with Google account
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              profilePicture: profile.photos[0]?.value || '',
              role: 'Student', // Default role for new OAuth users
              authProviders: ['google'] // User signed up with Google
            });
            console.log('Created new user from Google OAuth:', user.email);
          }
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session (if using sessions)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session (if using sessions)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
