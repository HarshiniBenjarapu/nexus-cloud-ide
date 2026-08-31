import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Route imports
import authRoutes from './routes/auth.routes';
import organizationRoutes from './routes/organization.routes';
import workspaceRoutes from './routes/workspace.routes';
import projectRoutes from './routes/project.routes';
import terminalRoutes from './routes/terminal.routes';
import gitRoutes from './routes/git.routes';
import databaseRoutes from './routes/database.routes';
import aiRoutes from './routes/ai.routes';
import deploymentRoutes from './routes/deployment.routes';
import collaborationRoutes from './routes/collaboration.routes';
import extensionRoutes from './routes/extension.routes';
import analyticsRoutes from './routes/analytics.routes';
import sandboxRoutes from './routes/sandbox.routes';
import webhookRoutes from './routes/webhook.routes';
import domainRoutes from './routes/domain.routes';
import { proxyProjectPreview } from './controllers/terminal.controller';

// Middleware imports
import { errorHandler, notFound } from './middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // ─── Security Middleware ──────────────────────────────────────────────────
  app.use(helmet());

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        const configured = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        const isVercel = origin.endsWith('.vercel.app');
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

        if (
          configured.includes('*') ||
          configured.includes(origin) ||
          isVercel ||
          isLocalhost ||
          configured.length === 0
        ) {
          callback(null, true);
        } else {
          console.warn(`[CORS Warning] Blocked request from origin: ${origin}`);
          callback(null, true); // Permissive fallback to prevent CORS blocks on custom deployment URLs
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  });
  app.use('/api', limiter);

  // ─── Auth-specific rate limit (prevent brute force) ───────────────────────
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // ─── Body Parser ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── HTTP Request Logger (development only) ───────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // ─── Health Check Endpoint ────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: '✅ Nexus Cloud IDE API is running.',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // ─── API Routes ───────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/terminal', terminalRoutes);
  app.get('/api/preview/:projectId', proxyProjectPreview);
  app.get('/api/preview/:projectId/*', proxyProjectPreview);
  app.use('/api/git', gitRoutes);
  app.use('/api/database', databaseRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/collaboration', collaborationRoutes);
  app.use('/api/extensions', extensionRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/containers/sandbox', sandboxRoutes);
  app.use('/api/deployments/webhook', webhookRoutes);
  app.use('/api/deployments', deploymentRoutes);
  app.use('/api/domains', domainRoutes);

  // ─── 404 Handler ──────────────────────────────────────────────────────────
  app.use(notFound);

  // ─── Global Error Handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};
