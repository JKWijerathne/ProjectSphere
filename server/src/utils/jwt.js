// JWT token generation and verification utilities
import jwt from 'jsonwebtoken';

// Generate JWT token for user authentication
export const generateToken = (userId) => {
  // Validate userId to prevent injection
  if (!userId || typeof userId !== 'string' && typeof userId !== 'object') {
    throw new Error('Invalid user ID');
  }

  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '30d',
      algorithm: 'HS256'                                    // Explicitly set algorithm to prevent algorithm confusion attacks
    }
  );
  
  return token;
};

// Verify JWT token and return decoded payload
export const verifyToken = (token) => {
  // Validate token input
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token format');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']                                           // Only allow HS256 to prevent algorithm confusion
    });
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
