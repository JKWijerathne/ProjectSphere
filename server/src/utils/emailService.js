import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
    });
  }
  console.warn('Email credentials not configured. Using test mode.');
  return null;
};

export const sendOTPEmail = async (to, otp, name) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`OTP for ${to}: ${otp}`);
      return { success: true, mode: 'development' };
    }
    const mailOptions = {
      from: `"ProjectSphere" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your ProjectSphere Verification Code',
      html: `<h1>Hello ${name}</h1><p>Your OTP: <strong>${otp}</strong></p><p>Expires in 2 minutes.</p>`,
      text: `Hello ${name}, Your OTP: ${otp}. Expires in 2 minutes.`
    };
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, mode: 'production' };
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Failed to send verification email.');
  }
};

export const sendWelcomeEmail = async (to, name, role) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`Welcome email for: ${to}`);
      return { success: true, mode: 'development' };
    }
    const mailOptions = {
      from: `"ProjectSphere" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Welcome to ProjectSphere!',
      html: `<h1>Welcome ${name}!</h1><p>Account Type: ${role}</p>`
    };
    await transporter.sendMail(mailOptions);
    return { success: true, mode: 'production' };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
};
