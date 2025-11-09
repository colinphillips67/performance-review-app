/**
 * Simple in-memory rate limiter for authentication endpoints
 * For production, consider using Redis-based rate limiting
 */

const attempts = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of attempts.entries()) {
    if (now - data.firstAttempt > 15 * 60 * 1000) { // 15 minutes
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter middleware
 * Limits to 5 attempts per 15 minutes per IP
 */
export const rateLimiter = (req, res, next) => {
  // Disable rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!attempts.has(ip)) {
    attempts.set(ip, {
      count: 1,
      firstAttempt: now
    });
    return next();
  }

  const data = attempts.get(ip);
  const timePassed = now - data.firstAttempt;

  // Reset if window has passed
  if (timePassed > windowMs) {
    attempts.set(ip, {
      count: 1,
      firstAttempt: now
    });
    return next();
  }

  // Increment attempt count
  data.count++;

  // Check if limit exceeded
  if (data.count > maxAttempts) {
    const timeLeft = Math.ceil((windowMs - timePassed) / 1000 / 60);
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many attempts. Please try again in ${timeLeft} minutes.`
      }
    });
  }

  next();
};
