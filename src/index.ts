import { config, features } from './utils/config';
import { logger } from './utils/logger';
import { runHealthChecks, quickHealthCheck } from './utils/health';
import { createDashboardServer } from './dashboard/server';
import { createWorker, Worker } from './worker';
import { createOrchestrator, Orchestrator } from './orchestrator';
import { SendEmailFunction } from './email/sequence-engine';

interface AutoWebsitesProConfig {
  startDashboard?: boolean;
  startWorker?: boolean;
  dashboardPort?: number;
  workerPollingMs?: number;
  sendEmail?: SendEmailFunction;
}

class AutoWebsitesPro {
  private dashboardServer?: { app: any; server: any };
  private worker?: Worker;
  private orchestrator?: Orchestrator;
  private isInitialized: boolean = false;

  async initialize(appConfig: AutoWebsitesProConfig = {}): Promise<void> {
    logger.info('Initializing AutoWebsites Pro...');

    // Run health checks
    const healthResult = await runHealthChecks();
    logger.info('Health check completed', { status: healthResult.status });

    if (healthResult.status === 'unhealthy') {
      const criticalFailures = healthResult.checks
        .filter(c => c.status === 'fail')
        .map(c => c.name);
      throw new Error(`Critical services unavailable: ${criticalFailures.join(', ')}`);
    }

    // Log available features
    logger.info('Available features', features);

    // Create mock email function if not provided
    const sendEmail: SendEmailFunction = appConfig.sendEmail || (async (to, subject, html, text) => {
      logger.info('[Mock Email]', { to, subject });
      return { messageId: `mock_${Date.now()}` };
    });

    // Initialize orchestrator
    this.orchestrator = createOrchestrator({
      senderName: config.COMPANY_NAME,
      senderCompany: config.COMPANY_NAME,
      senderEmail: config.COMPANY_EMAIL || 'hello@example.com',
      sendEmail,
    });

    // Start dashboard if requested
    if (appConfig.startDashboard !== false) {
      const port = appConfig.dashboardPort || config.DASHBOARD_PORT;
      this.dashboardServer = await createDashboardServer({
        port,
        jwtSecret: config.JWT_SECRET,
      });
      logger.info(`Dashboard started at http://localhost:${port}`);
    }

    // Start worker if requested
    if (appConfig.startWorker !== false) {
      this.worker = createWorker({
        sendEmail,
        senderName: config.COMPANY_NAME,
        senderCompany: config.COMPANY_NAME,
        pollingIntervalMs: appConfig.workerPollingMs || 60000,
      });
      this.worker.start();
      logger.info('Background worker started');
    }

    this.isInitialized = true;
    logger.info('AutoWebsites Pro initialized successfully');
  }

  getOrchestrator(): Orchestrator {
    if (!this.orchestrator) {
      throw new Error('AutoWebsites Pro not initialized');
    }
    return this.orchestrator;
  }

  getWorker(): Worker | undefined {
    return this.worker;
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down AutoWebsites Pro...');

    if (this.worker) {
      this.worker.stop();
    }

    if (this.dashboardServer) {
      await new Promise<void>((resolve) => {
        this.dashboardServer!.server.close(resolve);
      });
    }

    this.isInitialized = false;
    logger.info('Shutdown complete');
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let instance: AutoWebsitesPro | null = null;

export function getAutoWebsitesPro(): AutoWebsitesPro {
  if (!instance) {
    instance = new AutoWebsitesPro();
  }
  return instance;
}

// Export classes and functions
export { AutoWebsitesPro };
export { Orchestrator, createOrchestrator } from './orchestrator';
export { Worker, createWorker } from './worker';
export { createDashboardServer } from './dashboard/server';

// Export models
export { LeadModel, Lead, CreateLeadInput, UpdateLeadInput } from './crm/lead-model';
export { PipelineManager } from './crm/pipeline-manager';
export { ActivityLogger, Activity } from './crm/activity-logger';
export { ProposalGenerator } from './crm/proposal-generator';
export { ContractGenerator } from './crm/contract-generator';
export { PaymentHandler } from './crm/payment-handler';

// Export AI
export { ClaudeClient, getClaudeClient } from './ai/claude-client';
export { WebsiteAnalyzer, WebsiteAnalysis } from './ai/website-analyzer';
export { PitchGenerator, PitchEmail } from './ai/pitch-generator';
export { ObjectionHandler } from './ai/objection-handler';
export { getIndustryTemplate, INDUSTRIES, IndustryType } from './ai/industry-templates';

// Export email
export { EmailComposer } from './email/composer';
export { SequenceEngine } from './email/sequence-engine';
export { EmailAnalytics } from './email/analytics';
export { UnsubscribeHandler } from './email/unsubscribe';

// Export utilities
export { config, features } from './utils/config';
export { logger } from './utils/logger';
export { runHealthChecks, quickHealthCheck, getSystemInfo } from './utils/health';
export * from './utils/error-handler';
export * from './utils/validation';

// CLI entry point
if (require.main === module) {
  const app = getAutoWebsitesPro();

  // Handle shutdown signals
  const handleShutdown = async () => {
    await app.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  // Initialize and start
  app.initialize({
    startDashboard: true,
    startWorker: true,
  }).catch((error) => {
    logger.error('Failed to start', { error: error.message });
    process.exit(1);
  });
}
