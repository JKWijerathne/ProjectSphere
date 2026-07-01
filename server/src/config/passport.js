import dotenv from 'dotenv';

// Load environment variables FIRST in this file
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';
import { validateEmailForRole, getRoleFromEmail } from '../utils/emailDomainValidator.js';

// Debug: Check what's available when this file loads
console.log('Passport.js loading...');
console.log('GOOGLE_CLIENT_ID available:', process.env.GOOGLE_CLIENT_ID ? 'YES ✓' : 'NO ✗');
console.log('GOOGLE_CLIENT_SECRET available:', process.env.GOOGLE_CLIENT_SECRET ? 'YES ✓' : 'NO ✗');

// Configure Google OAuth Strategy only if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true, // Trust proxy if behind one (e.g., Heroku)
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          
          if (!email) {
            return done(new Error('No email provided by Google'));
          }

          console.log('Google OAuth Profile:', {
            id: profile.id,
            email: email,
            name: profile.displayName,
          });

          // Auto-detect role from email domain
          const detectedRole = getRoleFromEmail(email);
          
          if (!detectedRole) {
            const error = new Error('Please use a cerified email address to continue');
            error.email = email;
            return done(error);
          }

          // Validate email domain for the detected role
          const domainValidation = validateEmailForRole(email, detectedRole);
          if (!domainValidation.valid) {
            const error = new Error(domainValidation.message);
            error.email = email;
            return done(error);
          }

          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Check if user exists with the same email (link accounts)
            user = await User.findOne({ email });

            if (user) {
              // Verify the role matches
              if (user.role !== detectedRole) {
                const error = new Error(`Email ${email} is registered as ${user.role}, but trying to access as ${detectedRole}`);
                error.email = email;
                return done(error);
              }

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
                email,
                googleId: profile.id,
                profilePicture: profile.photos[0]?.value || '',
                role: detectedRole, // Auto-assign role based on email domain
                authProviders: ['google'] // User signed up with Google
              });
              console.log('Created new user from Google OAuth:', user.email, 'Role:', detectedRole);
            }
          } else {
            // User exists with Google ID, verify role hasn't changed
            if (user.role !== detectedRole) {
              const error = new Error(`Account role mismatch for ${email}`);
              error.email = email;
              return done(error);
            }
          }

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth Error:', error);
          return done(error);
        }
      }
    )
  );

  console.log('✅ Google OAuth configured successfully');
} else {
  console.log('⚠️  Google OAuth not configured (credentials missing in .env)');
}

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
