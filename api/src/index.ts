import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import intakeRouter from './routes/intake';
import statusRouter from './routes/status';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============= Middleware =============

// Security
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============= Routes =============

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/intake', intakeRouter);
app.use('/api/status', statusRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ============= Server Start =============

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Strategic Clarity Engine API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;

