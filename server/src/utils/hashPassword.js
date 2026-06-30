// Password hashing and comparison utilities using bcryptjs
import bcrypt from 'bcryptjs';

// Hash plain text password with bcrypt
export const hashPassword = async (password) => {
  // Validate password input
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  // Check password length for security
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  if (password.length > 128) {
    throw new Error('Password too long'); // Prevent DoS attacks
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};


// Compare plain password with hashed password (timing-attack safe)
export const comparePassword = async (plainPassword, hashedPassword) => {
  // Validate inputs
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Invalid password format');
  }

  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Invalid hash format');
  }

  // bcrypt.compare is already timing-attack resistant
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
};
