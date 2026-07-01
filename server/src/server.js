import dotenv from 'dotenv';
import dns from 'dns';

// Load environment variables FIRST before any other imports
dotenv.config();

// Debug: Log if Google OAuth credentials are loaded
console.log('Environment check:', {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Loaded ✓' : 'Missing ✗',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Loaded ✓' : 'Missing ✗',
  MONGO_URI: process.env.MONGO_URI ? 'Loaded ✓' : 'Missing ✗',
  JWT_SECRET: process.env.JWT_SECRET ? 'Loaded ✓' : 'Missing ✗',
});

import mongoose from 'mongoose';
import app from './app.js';
import { cleanupOrphanedUserReferences } from './utils/userCleanup.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

// Connect to database then start server
const connectionString = process.env.MONGO_URI;
mongoose.connect(connectionString).then(async () => {
  console.log('Connected to MongoDB');

  try {
    const result = await cleanupOrphanedUserReferences();
    if (result.updatedProjects || result.updatedUsers || result.deletedNotifications) {
      console.log('Cleaned orphaned user references:', result);
    }
  } catch (error) {
    console.error('Failed to clean orphaned user references:', error.message);
  }
}).catch((error) => {
  console.log('Error connecting to MongoDB', error);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});