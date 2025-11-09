import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '2h', // 2 hours session timeout
  refreshExpiresIn: '7d' // 7 days for refresh tokens (future enhancement)
};

export default jwtConfig;
