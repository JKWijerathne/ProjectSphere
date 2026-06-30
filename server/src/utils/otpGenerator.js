import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const generateOTP = () => crypto.randomInt(100000, 999999).toString();

export const hashOTP = async (otp) => {
  if (!otp || typeof otp !== 'string') throw new Error('OTP must be a non-empty string');
  return await bcrypt.hash(otp, 10);
};

export const compareOTP = async (plainOTP, hashedOTP) => {
  if (!plainOTP || typeof plainOTP !== 'string') throw new Error('Invalid OTP format');
  if (!hashedOTP || typeof hashedOTP !== 'string') throw new Error('Invalid hash format');
  return await bcrypt.compare(plainOTP, hashedOTP);
};

export const getOTPExpiration = () => {
  const exp = new Date();
  exp.setMinutes(exp.getMinutes() + 2);
  return exp;
};

export const isOTPExpired = (expiresAt) => new Date() > new Date(expiresAt);

export const getPendingRegistrationExpiration = () => {
  const exp = new Date();
  exp.setMinutes(exp.getMinutes() + 2);
  return exp;
};
