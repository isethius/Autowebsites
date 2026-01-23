import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { authMiddleware, AuthenticatedRequest, createAuthRouter } from './auth';
import { createLeadsRouter } from './routes/leads';
import { createCampaignsRouter } from './routes/campaigns';
import { createProposalsRouter } from './routes/proposals';
import { createAnalyticsRouter } from './routes/analytics';
import { createWebhookHandler } from '../email/webhook-handler';
import { createUnsubscribeHandler } from '../email/unsubscribe';

export interface DashboardConfig {
  port?: number;
  jwtSecret: string;
  corsOrigins?: string[];
}

export function createDashboardServer(config: DashboardConfig) {
  const app = express();
  const port = config.port || 3001;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!config.corsOrigins || config.corsOrigins.includes(origin || '')) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Static files
  app.use(express.static(path.join(__dirname, 'public')));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes (login, register - no auth required)
  app.use('/api/auth', createAuthRouter(config.jwtSecret));

  // Webhook routes (no auth - verified by signature)
  const webhookHandler = createWebhookHandler();
  app.post('/api/webhooks/sendgrid', async (req, res) => {
    try {
      const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
      const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;

      // Verify signature in production
      if (process.env.NODE_ENV === 'production' && signature && timestamp) {
        const isValid = webhookHandler.verifySignature(
          JSON.stringify(req.body),
          signature,
          timestamp
        );
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const events = Array.isArray(req.body) ? req.body : [req.body];
      const result = await webhookHandler.handleEvents(events);

      res.json(result);
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Unsubscribe routes (no auth - uses lead_id)
  const unsubscribeHandler = createUnsubscribeHandler();

  app.get('/unsubscribe', async (req, res) => {
    try {
      const leadId = req.query.lead_id as string;
      if (!leadId) {
        return res.status(400).send('Invalid unsubscribe link');
      }

      const data = await unsubscribeHandler.getUnsubscribePageData(leadId);
      if (!data) {
        return res.status(404).send('Invalid unsubscribe link');
      }

      res.send(unsubscribeHandler.generateUnsubscribePage(data, leadId));
    } catch (error: any) {
      console.error('Unsubscribe page error:', error);
      res.status(500).send('An error occurred');
    }
  });

  app.post('/api/unsubscribe', async (req, res) => {
    try {
      const { lead_id, feedback } = req.body;
      if (!lead_id) {
        return res.status(400).json({ error: 'Missing lead_id' });
      }

      const result = await unsubscribeHandler.processUnsubscribe(lead_id, {
        feedback,
        source: 'link_click',
      });

      if (req.headers.accept?.includes('text/html')) {
        res.send(unsubscribeHandler.generateSuccessPage());
      } else {
        res.json(result);
      }
    } catch (error: any) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Protected API routes
  app.use('/api/leads', authMiddleware(config.jwtSecret), createLeadsRouter());
  app.use('/api/campaigns', authMiddleware(config.jwtSecret), createCampaignsRouter());
  app.use('/api/proposals', authMiddleware(config.jwtSecret), createProposalsRouter());
  app.use('/api/analytics', authMiddleware(config.jwtSecret), createAnalyticsRouter());

  // Catch-all for SPA
  app.get('*', (req, res) => {
    // If it's an API request, return 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Serve index.html for all other routes
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  });

  // Start server
  const server = app.listen(port, () => {
    console.log(`Dashboard server running at http://localhost:${port}`);
  });

  return { app, server };
}

// CLI entry point
if (require.main === module) {
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  const port = parseInt(process.env.DASHBOARD_PORT || '3001', 10);

  createDashboardServer({ port, jwtSecret });
}
