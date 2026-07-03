# Gmail SMTP Setup Guide - Fix Email Issues

## Current Issue
```
Error: Greeting never received
Error: Timeout
code: 'ETIMEDOUT'
```

This means Gmail SMTP connection is failing. Let's fix it!

---

## Option 1: Verify Gmail App Password (Recommended)

### Step 1: Check if 2FA is Enabled
1. Go to: https://myaccount.google.com/security
2. Look for "2-Step Verification"
3. If **OFF**, turn it **ON** first

### Step 2: Generate NEW App Password
1. Go to: https://myaccount.google.com/apppasswords
2. If you see "App passwords are not available for your account":
   - You need to enable 2FA first (Step 1)
3. Click **"Select app"** → Choose "Other (Custom name)"
4. Type: `ProjectSphere`
5. Click **"Generate"**
6. **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)

### Step 3: Update .env File
Open `server/.env` and update:
```env
USE_EMAIL=true
EMAIL_USER=projectsphere6@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop  # ← Replace with YOUR App Password (no spaces)
```

### Step 4: Restart Backend
```bash
cd d:\ProjectSphere-backend\server
# Stop server (Ctrl+C)
npm start
```

You should see:
```
✅ Gmail SMTP connection verified - ready to send emails
```

---

## Option 2: Use Alternative Email Service

If Gmail doesn't work due to network/firewall issues, use a free alternative:

### A. Mailtrap (Best for Testing)
Free, no limits, catches all emails in one place.

1. Sign up: https://mailtrap.io/
2. Go to "Email Testing" → "Inboxes"
3. Copy credentials

Update `.env`:
```env
USE_EMAIL=true
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your_mailtrap_username
EMAIL_PASSWORD=your_mailtrap_password
```

### B. SendGrid (Production-Ready)
Free: 100 emails/day forever

1. Sign up: https://sendgrid.com/
2. Go to Settings → API Keys → Create API Key
3. Copy the API key

Update `.env`:
```env
USE_EMAIL=true
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=YOUR_SENDGRID_API_KEY
```

### C. Mailgun (Production-Ready)
Free: 5,000 emails/month for 3 months

1. Sign up: https://mailgun.com/
2. Go to Sending → Domain Settings → SMTP credentials
3. Copy credentials

Update `.env`:
```env
USE_EMAIL=true
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@YOUR_DOMAIN.mailgun.org
EMAIL_PASSWORD=your_mailgun_smtp_password
```

---

## Option 3: Fix Network/Firewall Issues

### Check if Port 587 is Blocked

**Windows PowerShell:**
```powershell
Test-NetConnection -ComputerName smtp.gmail.com -Port 587
```

Expected output:
```
TcpTestSucceeded : True
```

If **False**, port is blocked!

### Solutions:

#### A. Try Different Port (Gmail SSL)
Update `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
```

#### B. Check Windows Firewall
1. Open Windows Defender Firewall
2. Advanced Settings → Outbound Rules
3. Look for rules blocking port 587
4. Create new rule allowing port 587

#### C. Check Antivirus
Temporarily disable antivirus and test email.

#### D. Use VPN
If your ISP blocks SMTP, use a VPN.

---

## Testing Email Configuration

### Quick Test Script
Create `server/test-email-now.js`:

```javascript
import nodemailer from 'nodemailer';
import 'dotenv/config';

console.log('Testing email configuration...\n');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nPossible solutions:');
    console.log('1. Check App Password is correct');
    console.log('2. Enable 2FA on Gmail');
    console.log('3. Check internet connection');
    console.log('4. Try alternative email service');
  } else {
    console.log('✅ Connection successful!');
    console.log('Sending test email...\n');
    
    // Send test email
    transporter.sendMail({
      from: `"ProjectSphere" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email - ProjectSphere',
      text: 'If you receive this, email is working! ✅',
      html: '<h1>Success!</h1><p>Email service is working correctly! ✅</p>'
    }).then(() => {
      console.log('✅ Test email sent successfully!');
      console.log('Check your inbox:', process.env.EMAIL_USER);
      process.exit(0);
    }).catch(err => {
      console.error('❌ Failed to send email:', err.message);
      process.exit(1);
    });
  }
});
```

Run test:
```bash
cd d:\ProjectSphere-backend\server
node test-email-now.js
```

---

## Common Issues & Fixes

### Issue 1: "Invalid login: 535-5.7.8 Username and Password not accepted"
**Cause**: Wrong password or not using App Password

**Fix**:
1. Generate NEW App Password
2. Copy it exactly (no spaces)
3. Update `.env`
4. Restart server

### Issue 2: "Greeting never received" / "ETIMEDOUT"
**Cause**: Network/firewall blocking SMTP

**Fixes**:
1. Try port 465 instead of 587
2. Use alternative email service (Mailtrap/SendGrid)
3. Check firewall settings
4. Use VPN

### Issue 3: "Self signed certificate"
**Cause**: SSL certificate issues

**Fix**: Use Mailtrap or SendGrid instead

### Issue 4: "Too many login attempts"
**Cause**: Gmail rate limiting

**Fix**: Wait 1 hour, then try again

### Issue 5: "Less secure app access"
**Cause**: Old Gmail security setting (deprecated)

**Fix**: Must use App Password with 2FA now

---

## Recommended Solution (Step-by-Step)

### For Immediate Testing: Use Mailtrap

1. **Sign up**: https://mailtrap.io/ (free, instant)

2. **Get credentials**:
   - Go to "Inboxes" → "SMTP Settings"
   - Copy username and password

3. **Update `.env`**:
   ```env
   USE_EMAIL=true
   EMAIL_HOST=sandbox.smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_SECURE=false
   EMAIL_USER=your_username_here
   EMAIL_PASSWORD=your_password_here
   ```

4. **Restart backend**:
   ```bash
   npm start
   ```

5. **Register user** → Check Mailtrap inbox for OTP email

**Why Mailtrap?**
- ✅ No Gmail issues
- ✅ No firewall problems
- ✅ Instant setup
- ✅ See all emails in one place
- ✅ Perfect for development

### For Production: Use SendGrid

1. **Sign up**: https://sendgrid.com/ (100 emails/day free)

2. **Create API Key**:
   - Settings → API Keys → Create API Key
   - Full Access → Create & Review
   - Copy the key (only shown once!)

3. **Verify sender email**:
   - Settings → Sender Authentication
   - Verify Single Sender
   - Use `projectsphere6@gmail.com`
   - Confirm via email link

4. **Update `.env`**:
   ```env
   USE_EMAIL=true
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=YOUR_SENDGRID_API_KEY
   ```

5. **Restart and test**

---

## Checklist

Before testing email:

- [ ] `.env` has `USE_EMAIL=true`
- [ ] Email credentials are correct (no spaces in password)
- [ ] Backend server restarted after changing `.env`
- [ ] Port 587 or 2525 is not blocked
- [ ] Internet connection is active
- [ ] For Gmail: 2FA enabled + App Password created
- [ ] For other services: Sender email verified

---

## Expected Backend Console Output

### Success:
```
📧 Initializing Gmail SMTP service...
✅ Gmail SMTP connection verified - ready to send emails

============================================================
📧 OTP Email Request
   To: student@stu.kln.ac.lk
   OTP: 123456
   Name: Test Student
============================================================

✅ OTP email sent successfully to student@stu.kln.ac.lk
```

### Failure:
```
📧 Initializing Gmail SMTP service...
❌ Gmail SMTP connection failed: Greeting never received
⚠️  Please check:
   1. Gmail App Password is correct
   2. 2-Factor Authentication is enabled
   3. Internet connection is active
   4. Firewall is not blocking port 587
```

---

## Quick Fix Right Now

**Option 1: New Gmail App Password**
1. https://myaccount.google.com/apppasswords
2. Generate new password
3. Update `.env`
4. Restart server

**Option 2: Switch to Mailtrap (5 minutes)**
1. https://mailtrap.io/signin
2. Sign up → Get credentials
3. Update `.env` with Mailtrap credentials
4. Restart server
5. ✅ Emails work immediately

**I recommend Option 2 (Mailtrap) for immediate results!**

---

## Need Help?

1. Run test script: `node test-email-now.js`
2. Share the error message
3. We can troubleshoot further

The issue is almost always:
- ❌ Wrong App Password
- ❌ Network blocking port 587
- ❌ 2FA not enabled

**Mailtrap fixes all of these! 🎯**

