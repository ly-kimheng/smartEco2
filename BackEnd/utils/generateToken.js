// utils/generateToken.js
//kesar
// Signs a JWT for a given user id

// utils/generateToken.js
import jwt from 'jsonwebtoken';

export default function generateToken(userId, role = 'user') {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in the environment');
  }

  return jwt.sign({ id: userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}