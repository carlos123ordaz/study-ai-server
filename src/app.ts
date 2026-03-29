import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from 'passport';

import { env } from './config/env';
import './config/passport'; // Initialize passport strategies
import { errorHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';
import { logger } from './utils/logger';

import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import quizRoutes from './routes/quizzes';
import creditRoutes from './routes/credits';
import paymentRoutes from './routes/payments';

const app = express();

// ========================
// Security
// ========================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ========================
// Body parsing & utilities
// ========================
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ========================
// Logging
// ========================
if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ========================
// Auth
// ========================
app.use(passport.initialize());

// ========================
// Rate limiting
// ========================
app.use('/api', generalLimiter);

// ========================
// Health check
// ========================
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: env.nodeEnv,
  });
});

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/payments', paymentRoutes);

// 404
app.use('*', (_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ========================
// Error Handler (must be last)
// ========================
app.use(errorHandler);

export default app;
