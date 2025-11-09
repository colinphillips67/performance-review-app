import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Note: dotenv is configured in database.js to ensure correct env loading order
// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orgChartRoutes from './routes/orgChartRoutes.js';
import reviewCycleRoutes from './routes/reviewCycleRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import teamReviewRoutes from './routes/teamReviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
// Rate limiter disabled for development
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/org-chart', orgChartRoutes);
app.use('/api/review-cycles', reviewCycleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/team-reviews', teamReviewRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
