import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe('AlertManager', () => {
  beforeEach(() => {
    delete process.env.ALERT_EMAIL_TO;
    delete process.env.ALERT_WEBHOOK_URL;
    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.DISCORD_WEBHOOK_URL;
  });

  it('stores alerts and exposes recent/unresolved alerts', async () => {
    const { AlertManager } = await import('../scheduler/alerting');
    const manager = new AlertManager();

    const alert = await manager.sendAlert('job_failed', 'warning', 'Job Failed', 'Something broke');

    const recent = manager.getRecentAlerts(1);
    expect(recent[0]?.id).toBe(alert.id);

    const unresolved = manager.getUnresolvedAlerts();
    expect(unresolved.some(item => item.id === alert.id)).toBe(true);
    expect(alert.createdAt).toBeInstanceOf(Date);
  });

  it('acknowledges and resolves alerts', async () => {
    const { AlertManager } = await import('../scheduler/alerting');
    const manager = new AlertManager();

    const alert = await manager.sendAlert('job_failed', 'warning', 'Job Failed', 'Something broke');

    expect(manager.acknowledgeAlert(alert.id)).toBe(true);
    expect(manager.resolveAlert(alert.id)).toBe(true);
    expect(manager.getUnresolvedAlerts().length).toBe(0);
    expect(manager.acknowledgeAlert(alert.id)).toBe(false);
  });

  it('sets severity based on queue backlog thresholds', async () => {
    const { AlertManager } = await import('../scheduler/alerting');
    const manager = new AlertManager({ queueBacklogCritical: 10, queueBacklogWarning: 5 });

    const warningAlert = await manager.alertQueueBacklog(5, { queue: 5 });
    expect(warningAlert.severity).toBe('warning');

    const criticalAlert = await manager.alertQueueBacklog(10, { queue: 10 });
    expect(criticalAlert.severity).toBe('critical');
  });
});
