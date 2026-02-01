import { logger } from '../utils/logger';
import { JobType, JobStatus } from './queue';
import { sendEmail as sendEmailViaProvider } from '../email';

/**
 * Alert types for the monitoring system
 */
export type AlertType =
  | 'job_failed'
  | 'job_stuck'
  | 'queue_backlog'
  | 'high_failure_rate'
  | 'dlq_threshold'
  | 'worker_unhealthy';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

/**
 * Alert channel configuration
 */
export interface AlertChannel {
  type: 'console' | 'email' | 'webhook' | 'slack' | 'discord';
  enabled: boolean;
  config?: Record<string, string>;
  minSeverity?: AlertSeverity;
}

/**
 * Alert thresholds configuration
 */
export interface AlertThresholds {
  /** Queue backlog size that triggers warning */
  queueBacklogWarning: number;
  /** Queue backlog size that triggers critical alert */
  queueBacklogCritical: number;
  /** Time in ms after which a running job is considered stuck */
  jobStuckThresholdMs: number;
  /** Failure rate percentage that triggers warning (0-100) */
  failureRateWarning: number;
  /** Failure rate percentage that triggers critical alert */
  failureRateCritical: number;
  /** Number of DLQ items that triggers alert */
  dlqThreshold: number;
  /** Time window in ms for calculating failure rate */
  failureRateWindowMs: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  queueBacklogWarning: 100,
  queueBacklogCritical: 500,
  jobStuckThresholdMs: 30 * 60 * 1000,  // 30 minutes
  failureRateWarning: 10,
  failureRateCritical: 25,
  dlqThreshold: 10,
  failureRateWindowMs: 60 * 60 * 1000,  // 1 hour
};

/**
 * Alert manager for monitoring and notifications
 */
export class AlertManager {
  private channels: AlertChannel[] = [];
  private thresholds: AlertThresholds;
  private alerts: Map<string, Alert> = new Map();
  private recentAlerts: Alert[] = [];
  private maxRecentAlerts = 100;

  constructor(thresholds: Partial<AlertThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

    // Default console channel
    this.addChannel({
      type: 'console',
      enabled: true,
      minSeverity: 'warning',
    });

    // Add email channel if configured
    if (process.env.ALERT_EMAIL_TO) {
      this.addChannel({
        type: 'email',
        enabled: true,
        config: {
          to: process.env.ALERT_EMAIL_TO,
          from: process.env.ALERT_EMAIL_FROM || 'alerts@autowebsites.pro',
        },
        minSeverity: 'critical',
      });
    }

    // Add webhook channel if configured
    if (process.env.ALERT_WEBHOOK_URL) {
      this.addChannel({
        type: 'webhook',
        enabled: true,
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          secret: process.env.ALERT_WEBHOOK_SECRET,
        },
        minSeverity: 'warning',
      });
    }

    // Add Slack channel if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      this.addChannel({
        type: 'slack',
        enabled: true,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
        },
        minSeverity: 'warning',
      });
    }

    // Add Discord channel if configured
    if (process.env.DISCORD_WEBHOOK_URL) {
      this.addChannel({
        type: 'discord',
        enabled: true,
        config: {
          webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        },
        minSeverity: 'warning',
      });
    }
  }

  /**
   * Add an alert channel
   */
  addChannel(channel: AlertChannel): void {
    this.channels.push(channel);
  }

  /**
   * Send an alert through all configured channels
   */
  async sendAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<Alert> {
    const alert: Alert = {
      id: this.generateAlertId(),
      type,
      severity,
      title,
      message,
      data,
      createdAt: new Date(),
    };

    // Store alert
    this.alerts.set(alert.id, alert);
    this.recentAlerts.unshift(alert);
    if (this.recentAlerts.length > this.maxRecentAlerts) {
      this.recentAlerts.pop();
    }

    // Send to all enabled channels with matching severity
    const sendPromises = this.channels
      .filter(channel => {
        if (!channel.enabled) return false;
        return this.severityMeets(severity, channel.minSeverity || 'info');
      })
      .map(channel => this.sendToChannel(channel, alert));

    await Promise.allSettled(sendPromises);

    return alert;
  }

  /**
   * Check if severity meets minimum threshold
   */
  private severityMeets(actual: AlertSeverity, minimum: AlertSeverity): boolean {
    const levels: AlertSeverity[] = ['info', 'warning', 'critical'];
    return levels.indexOf(actual) >= levels.indexOf(minimum);
  }

  /**
   * Send alert to a specific channel
   */
  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    try {
      switch (channel.type) {
        case 'console':
          this.sendToConsole(alert);
          break;
        case 'email':
          await this.sendToEmail(channel, alert);
          break;
        case 'webhook':
          await this.sendToWebhook(channel, alert);
          break;
        case 'slack':
          await this.sendToSlack(channel, alert);
          break;
        case 'discord':
          await this.sendToDiscord(channel, alert);
          break;
      }
    } catch (error: any) {
      logger.error(`Failed to send alert to ${channel.type}`, {
        alertId: alert.id,
        error: error.message,
      });
    }
  }

  /**
   * Send alert to console (logger)
   */
  private sendToConsole(alert: Alert): void {
    const logMethod = alert.severity === 'critical' ? 'error' :
                      alert.severity === 'warning' ? 'warn' : 'info';

    logger[logMethod](`[ALERT] ${alert.title}`, {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      data: alert.data,
    });
  }

  /**
   * Send alert via email using configured email provider
   */
  private async sendToEmail(channel: AlertChannel, alert: Alert): Promise<void> {
    const { to, from } = channel.config || {};

    if (!to) {
      logger.warn('Alert email recipient not configured');
      return;
    }

    const severityEmoji = alert.severity === 'critical' ? '🚨' :
                          alert.severity === 'warning' ? '⚠️' : 'ℹ️';

    const subject = `${severityEmoji} [${alert.severity.toUpperCase()}] ${alert.title}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">${severityEmoji} ${alert.title}</h2>
        </div>
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">${alert.message}</p>
          ${alert.data ? `
            <h4 style="margin-bottom: 8px; color: #6b7280;">Details</h4>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(alert.data).map(([key, value]) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; background: white; font-weight: 500;">${key}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; background: white;">${String(value)}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}
          <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
            Alert ID: ${alert.id}<br>
            Type: ${alert.type}<br>
            Time: ${alert.createdAt.toISOString()}
          </p>
        </div>
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 12px;">
          AutoWebsites Pro Alert System
        </p>
      </div>
    `;

    try {
      const result = await sendEmailViaProvider({
        to,
        from: from || 'alerts@autowebsites.pro',
        fromName: 'AutoWebsites Alerts',
        subject,
        html,
        text: `${alert.title}\n\n${alert.message}\n\nAlert ID: ${alert.id}\nType: ${alert.type}\nSeverity: ${alert.severity}\nTime: ${alert.createdAt.toISOString()}`,
      });

      if (!result.success) {
        logger.warn('Failed to send alert email', { error: result.error, alertId: alert.id });
      }
    } catch (error: any) {
      logger.error('Error sending alert email', { error: error.message, alertId: alert.id });
    }
  }

  /**
   * Send alert to webhook
   */
  private async sendToWebhook(channel: AlertChannel, alert: Alert): Promise<void> {
    const { url, secret } = channel.config || {};
    if (!url) return;

    const payload = {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      data: alert.data,
      timestamp: alert.createdAt.toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (secret) {
      const crypto = await import('crypto');
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  /**
   * Send alert to Slack
   */
  private async sendToSlack(channel: AlertChannel, alert: Alert): Promise<void> {
    const { webhookUrl } = channel.config || {};
    if (!webhookUrl) return;

    const color = alert.severity === 'critical' ? '#dc2626' :
                  alert.severity === 'warning' ? '#f59e0b' : '#3b82f6';

    const payload = {
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: alert.data ? Object.entries(alert.data).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true,
        })) : [],
        footer: `AutoWebsites Pro | ${alert.type}`,
        ts: Math.floor(alert.createdAt.getTime() / 1000),
      }],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Send alert to Discord
   */
  private async sendToDiscord(channel: AlertChannel, alert: Alert): Promise<void> {
    const { webhookUrl } = channel.config || {};
    if (!webhookUrl) return;

    const color = alert.severity === 'critical' ? 0xdc2626 :
                  alert.severity === 'warning' ? 0xf59e0b : 0x3b82f6;

    const payload = {
      embeds: [{
        title: alert.title,
        description: alert.message,
        color,
        fields: alert.data ? Object.entries(alert.data).map(([name, value]) => ({
          name,
          value: String(value),
          inline: true,
        })) : [],
        footer: {
          text: `AutoWebsites Pro | ${alert.type}`,
        },
        timestamp: alert.createdAt.toISOString(),
      }],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.acknowledgedAt) {
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolvedAt) {
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 20): Alert[] {
    return this.recentAlerts.slice(0, limit);
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(a => !a.resolvedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Pre-built alert methods for common scenarios

  /**
   * Alert when a job fails permanently (exhausted retries)
   */
  async alertJobFailed(
    jobId: string,
    jobType: JobType,
    error: string,
    attempts: number
  ): Promise<Alert> {
    return this.sendAlert(
      'job_failed',
      'warning',
      `Job Failed: ${jobType}`,
      `Job ${jobId.slice(0, 8)} failed after ${attempts} attempts: ${error}`,
      { jobId, jobType, error, attempts }
    );
  }

  /**
   * Alert when a job appears stuck
   */
  async alertJobStuck(
    jobId: string,
    jobType: JobType,
    runningForMs: number
  ): Promise<Alert> {
    const runningFor = Math.round(runningForMs / 60000);
    return this.sendAlert(
      'job_stuck',
      'warning',
      `Job Stuck: ${jobType}`,
      `Job ${jobId.slice(0, 8)} has been running for ${runningFor} minutes`,
      { jobId, jobType, runningForMinutes: runningFor }
    );
  }

  /**
   * Alert when queue backlog exceeds threshold
   */
  async alertQueueBacklog(
    pendingCount: number,
    byType: Record<string, number>
  ): Promise<Alert> {
    const severity: AlertSeverity =
      pendingCount >= this.thresholds.queueBacklogCritical ? 'critical' : 'warning';

    return this.sendAlert(
      'queue_backlog',
      severity,
      'Queue Backlog High',
      `${pendingCount} jobs pending in queue`,
      { pendingCount, byType }
    );
  }

  /**
   * Alert when failure rate exceeds threshold
   */
  async alertHighFailureRate(
    failureRate: number,
    failedCount: number,
    totalCount: number
  ): Promise<Alert> {
    const severity: AlertSeverity =
      failureRate >= this.thresholds.failureRateCritical ? 'critical' : 'warning';

    return this.sendAlert(
      'high_failure_rate',
      severity,
      'High Job Failure Rate',
      `${failureRate.toFixed(1)}% of jobs failing (${failedCount}/${totalCount})`,
      { failureRate, failedCount, totalCount }
    );
  }

  /**
   * Alert when DLQ items exceed threshold
   */
  async alertDLQThreshold(dlqCount: number): Promise<Alert> {
    return this.sendAlert(
      'dlq_threshold',
      'critical',
      'Dead Letter Queue Growing',
      `${dlqCount} items in dead letter queue require attention`,
      { dlqCount }
    );
  }

  /**
   * Alert when worker appears unhealthy
   */
  async alertWorkerUnhealthy(
    workerId: string,
    reason: string
  ): Promise<Alert> {
    return this.sendAlert(
      'worker_unhealthy',
      'critical',
      'Worker Unhealthy',
      `Worker ${workerId} appears unhealthy: ${reason}`,
      { workerId, reason }
    );
  }

  /**
   * Get thresholds (for monitoring dashboard)
   */
  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds
   */
  updateThresholds(updates: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...updates };
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// Singleton instance
let alertManagerInstance: AlertManager | null = null;

export function getAlertManager(thresholds?: Partial<AlertThresholds>): AlertManager {
  if (!alertManagerInstance) {
    alertManagerInstance = new AlertManager(thresholds);
  }
  return alertManagerInstance;
}
