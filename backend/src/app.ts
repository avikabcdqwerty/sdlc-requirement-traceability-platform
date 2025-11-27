import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import { createConnection } from 'typeorm';
import { WinstonLogger } from './utils/logger';
import { requirementRouter } from './routes/requirement.routes';
import { traceabilityRouter } from './routes/traceability.routes';
import { integrationRouter } from './routes/integration.routes';
import { auditlogRouter } from './routes/auditlog.routes';
import { authRouter } from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';
import { auditLogMiddleware } from './middleware/auditlog.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Initialize logger
const logger = WinstonLogger.getInstance();

// Load Swagger documentation
const swaggerDocument = YAML.load(path.resolve(__dirname, '../docs/swagger.yaml'));

// Create Express app
const app: Application = express();

// Database connection
createConnection()
  .then(() => {
    logger.info('Database connection established');
  })
  .catch((error) => {
    logger.error('Database connection error:', error);
    process.exit(1);
  });

// Middleware setup
app.use(helmet()); // Security headers
app.use(cors({ origin: true, credentials: true })); // CORS configuration
app.use(express.json({ limit: '2mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Session setup (for Passport.js)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'sdlc_traceability_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Passport.js initialization
app.use(passport.initialize());
app.use(passport.session());

// HTTP request logging
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  })
);

// Audit logging middleware (logs all access/modifications)
app.use(auditLogMiddleware);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/requirements', authMiddleware, requirementRouter);
app.use('/api/traceability', authMiddleware, traceabilityRouter);
app.use('/api/integration', authMiddleware, integrationRouter);
app.use('/api/auditlog', authMiddleware, auditlogRouter);

// Swagger API docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Not Found' });
});

// Centralized error handler
app.use(errorHandler);

// Export Express app for server/bootstrap
export { app };