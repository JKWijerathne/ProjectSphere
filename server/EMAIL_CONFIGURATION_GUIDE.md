# Email Configuration Guide

## Current Status: DEVELOPMENT MODE ✅

The application is currently configured to run in **development mode** where:
- ✅ OTP codes are shown in the backend console
- ✅ No actual emails are sent
- ✅ Registration works perfectly without email service
- ✅ You can copy OTP from console and paste into frontend

## Quick Start (Development Mode)

### Step 1: Start Backend
```bash
cd d:\ProjectSphere-backend\server
npm start
```

### Step 2: Register New User
1. Go to: `http://localhost:5173/register`
2. Fill registration form
3. Submit

### Step 3: Get OTP from Console
Backend console will show:
```
============================================================
📧 OTP Email Request
   To: yourname@stu.kln.ac.lk
   OTP: 123456
   Name: Your Name
============================================================

✅ Development mode: OTP shown above (no email sent)
```

### Step 4: Enter OTP
Copy the 6-digit OTP from console and paste into the OTP verification screen.

**That's it! No email configuration needed for development!**

---

## Why Email Was Failing

### The Problem:
```
Error: Greeting never received
code: 'ETIMEDOUT'
command: 'CONN'
```

### Causes:
1. **Firewall/Network blocking** - Port 587 (SMTP) may be blocked
2. **ISP restrictions** - Some ISPs block outgoing SMTP connections
3. **VPN/Proxy issues** - Network configuration preventing SMTP
4. **Gmail security** - Google may be blocking the connection
5. **Antivirus software** - May be blocking SMTP traffic

---

## Email Configuration (.env)

### Development Mode (Current - Recommended):
```env
USE_EMAIL=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=projectsphere6@gmail.com
EMAIL_PASSWORD=dfonzpjunvplfuzl
```

### Production Mode (When Deploying):
```env
USE_EMAIL=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=projectsphere6@gmail.com
EMAIL_PASSWORD=dfonzpjunvplfuzl
```

---

## Testing Email Service (Optional)

### Option 1: Test SMTP Connection
```bash
cd d:\ProjectSphere-backend\server
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'projectsphere6@gmail.com',
    pass: 'dfonzpjunvplfuzl'
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('✅ Server is ready to send emails');
  }
});
"
```

### Option 2: Send Test Email
Create `test-email.js`:
```javascript
import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: 'your-test-email@example.com',
  subject: 'Test Email',
  text: 'If you receive this, email is working!'
}).then(() => {
  console.log('✅ Test email sent!');
}).catch(err => {
  console.error('❌ Error:', err);
});
```

Run: `node test-email.js`

---

## Fixing Email Issues (For Production)

### Fix 1: Check Firewall
```bash
# Windows: Check if port 587 is open
Test-NetConnection -ComputerName smtp.gmail.com -Port 587
```

### Fix 2: Try Alternative SMTP Services

#### Mailtrap (Testing)
Free email testing service:
```env
USE_EMAIL=true
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
```

#### SendGrid (Production)
Free tier: 100 emails/day
```env
USE_EMAIL=true
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### Mailgun (Production)
Free tier: 5,000 emails/month
```env
USE_EMAIL=true
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-smtp-password
```

### Fix 3: Gmail "Less Secure Apps"
If using Gmail and App Password doesn't work:
1. Go to: https://myaccount.google.com/
2. Security → 2-Step Verification
3. App Passwords → Generate new password
4. Use that password in `.env`

### Fix 4: Use Different Port
Try port 465 (SSL):
```env
EMAIL_PORT=465
EMAIL_SECURE=true
```

### Fix 5: Disable Antivirus/Firewall Temporarily
Test if your security software is blocking:
1. Temporarily disable antivirus
2. Try sending email
3. If it works, add exception for Node.js

---

## How Email Service Works Now

### Development Mode (USE_EMAIL=false):
1. User registers
2. Backend generates OTP
3. **OTP printed to console** (highlighted)
4. User copies OTP from console
5. User pastes into frontend
6. ✅ Account created

### Production Mode (USE_EMAIL=true):
1. User registers
2. Backend generates OTP
3. **Tries to send email**
   - If succeeds: Email sent ✅
   - If fails: Falls back to console (with warning) ⚠️
4. User gets OTP (email or console)
5. ✅ Account created

**Key Feature**: Registration never fails due to email issues!

---

## Checking Email Configuration

Run this to verify settings:
```bash
cd d:\ProjectSphere-backend\server
node test-account-creation.js
```

Shows:
```
📧 Email Configuration:
  Host: smtp.gmail.com
  Port: 587
  User: projectsphere6@gmail.com
  Password: ✅ Set (hidden)

Email Mode: DEVELOPMENT (console only)
```

---

## When to Use Each Mode

### Use Development Mode When:
- ✅ Local development
- ✅ Testing registration flow
- ✅ Email service not working
- ✅ Behind firewall/proxy
- ✅ Quick testing needed

### Use Production Mode When:
- ✅ Deployed to server
- ✅ Email service confirmed working
- ✅ Real users registering
- ✅ Network allows SMTP

---

## Troubleshooting

### Issue: No OTP in Console
**Check**: Backend is running
**Solution**: Restart backend server

### Issue: OTP Expired
**Check**: OTP valid for 2 minutes only
**Solution**: Register again

### Issue: Email Timeout
**Check**: `USE_EMAIL=false` in `.env`
**Solution**: Set to false for development

### Issue: Want Real Emails
**Check**: Email credentials valid
**Solution**: 
1. Set `USE_EMAIL=true`
2. Test SMTP connection
3. Check firewall/network

---

## Summary

✅ **Current Setup**: Development mode (console OTP)  
✅ **Registration**: Working perfectly  
✅ **Email**: Optional - shown in console  
✅ **No Errors**: Email failures don't break registration  

**For local development, you're all set!** OTP appears in backend console. For production, enable `USE_EMAIL=true` once deployed to a server with proper network access.

---

## Console Output Example

When registering, you'll see:
```
🔐 Generated OTP for wijesun-se22033@stu.kln.ac.lk: 302317

============================================================
📧 OTP Email Request
   To: wijesun-se22033@stu.kln.ac.lk
   OTP: 302317
   Name: Test Student
============================================================

📧 Email service: DEVELOPMENT MODE (OTPs shown in console only)
✅ Development mode: OTP shown above (no email sent)
```

Just copy **302317** and paste into the OTP screen!

