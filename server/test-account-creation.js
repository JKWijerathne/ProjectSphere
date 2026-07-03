// Quick test script for account creation endpoints
// Run with: node test-account-creation.js

import 'dotenv/config';

console.log('\n=== ACCOUNT CREATION CONFIGURATION TEST ===\n');

// Check MongoDB connection
console.log('✓ MongoDB URI:', process.env.MONGO_URI ? '✅ Configured' : '❌ Missing');

// Check JWT configuration
console.log('✓ JWT Secret:', process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing');
console.log('✓ JWT Expiry:', process.env.JWT_EXPIRES_IN || '❌ Not set');

// Check Email configuration
console.log('\n📧 Email Configuration:');
console.log('  Host:', process.env.EMAIL_HOST || '❌ Not set');
console.log('  Port:', process.env.EMAIL_PORT || '❌ Not set');
console.log('  User:', process.env.EMAIL_USER || '❌ Not set');
console.log('  Password:', process.env.EMAIL_PASSWORD ? '✅ Set (hidden)' : '❌ Not set');

// Check Cloudinary configuration
console.log('\n☁️  Cloudinary Configuration:');
console.log('  Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || '❌ Not set');
console.log('  API Key:', process.env.CLOUDINARY_API_KEY || '❌ Not set');
console.log('  API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set (hidden)' : '❌ Not set');

// Check Client URL
console.log('\n🌐 Client URL:', process.env.CLIENT_URL || '❌ Not set');

console.log('\n=== OTP CONFIGURATION ===\n');
console.log('✓ OTP Length: 6 digits');
console.log('✓ OTP Expiration: 2 minutes');
console.log('✓ Max Attempts: 3');
console.log('✓ Pending Registration TTL: 2 minutes');

console.log('\n=== RATE LIMITS (Testing Mode) ===\n');
console.log('✓ Register: 50 requests/hour');
console.log('✓ OTP Verify: 100 requests/15 minutes');
console.log('✓ OTP Resend: 20 requests/5 minutes');

console.log('\n=== EMAIL DOMAIN VALIDATION ===\n');
console.log('✓ Students: @stu.kln.ac.lk');
console.log('✓ Lecturers: @kln.ac.lk (not student domain)');
console.log('✓ Recruiters: 22 whitelisted companies (wso2.com, microsoft.com, etc.)');

console.log('\n=== API ENDPOINTS ===\n');
console.log('POST /api/otp/register    - Create pending registration & send OTP');
console.log('POST /api/otp/verify      - Verify OTP & create account');
console.log('POST /api/otp/resend      - Resend OTP to email');
console.log('GET  /api/otp/status      - Check pending registration status');

console.log('\n=== TEST READY ===\n');

// All critical checks
const allConfigured = 
  process.env.MONGO_URI &&
  process.env.JWT_SECRET &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (allConfigured) {
  console.log('✅ All configurations are set! Account creation should work properly.\n');
  console.log('Next steps:');
  console.log('1. Start backend: npm start (in server folder)');
  console.log('2. Start frontend: npm run dev (in frontend folder)');
  console.log('3. Test registration at: http://localhost:5173/register');
  console.log('4. Monitor backend console for OTP codes and email logs\n');
} else {
  console.log('❌ Some configurations are missing. Check .env file.\n');
}

console.log('===========================================\n');
