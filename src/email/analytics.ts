import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../utils/supabase';

export interface EmailMetrics {
  // Volume
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalSpam: number;
  totalUnsubscribed: number;

  // Rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  spamRate: number;
  unsubscribeRate: number;
}

export interface DailyMetrics extends EmailMetrics {
  date: string;
}

export interface SubjectLinePerformance {
  subject: string;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface SendTimePerformance {
  hour: number;
  dayOfWeek: number;
  sent: number;
  opened: number;
  openRate: number;
}

export interface CampaignMetrics extends EmailMetrics {
  campaignId: string;
  campaignName: string;
  sentAt: string;
}

export class EmailAnalytics {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  async getOverallMetrics(dateRange?: { start: string; end: string }): Promise<EmailMetrics> {
    let query = this.supabase.from('email_events').select('event_type');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get metrics: ${error.message}`);

    return this.calculateMetrics(data || []);
  }

  async getDailyMetrics(days: number = 30): Promise<DailyMetrics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('email_events')
      .select('event_type, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get daily metrics: ${error.message}`);

    // Group by date
    const byDate: Record<string, any[]> = {};
    for (const event of data || []) {
      const date = event.created_at.split('T')[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(event);
    }

    // Calculate metrics per day
    const dailyMetrics: DailyMetrics[] = [];
    for (const [date, events] of Object.entries(byDate)) {
      dailyMetrics.push({
        date,
        ...this.calculateMetrics(events),
      });
    }

    return dailyMetrics.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getSubjectLinePerformance(limit: number = 20): Promise<SubjectLinePerformance[]> {
    // Get all email events with subject lines
    const { data, error } = await this.supabase
      .from('email_events')
      .select('email_subject, event_type')
      .not('email_subject', 'is', null);

    if (error) throw new Error(`Failed to get subject performance: ${error.message}`);

    // Group by subject
    const bySubject: Record<string, { sent: number; opened: number; clicked: number }> = {};

    for (const event of data || []) {
      const subject = event.email_subject;
      if (!subject) continue;

      if (!bySubject[subject]) {
        bySubject[subject] = { sent: 0, opened: 0, clicked: 0 };
      }

      switch (event.event_type) {
        case 'sent':
        case 'delivered':
          bySubject[subject].sent++;
          break;
        case 'opened':
          bySubject[subject].opened++;
          break;
        case 'clicked':
          bySubject[subject].clicked++;
          break;
      }
    }

    // Calculate rates and sort by performance
    const performance: SubjectLinePerformance[] = Object.entries(bySubject)
      .map(([subject, stats]) => ({
        subject,
        ...stats,
        openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
        clickRate: stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0,
      }))
      .filter(s => s.sent >= 5) // Minimum sample size
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, limit);

    return performance;
  }

  async getBestSendTimes(): Promise<{
    bestHours: { hour: number; openRate: number }[];
    bestDays: { day: string; openRate: number }[];
    heatmap: SendTimePerformance[];
  }> {
    const { data, error } = await this.supabase
      .from('email_events')
      .select('event_type, created_at')
      .in('event_type', ['sent', 'delivered', 'opened']);

    if (error) throw new Error(`Failed to get send time data: ${error.message}`);

    // Group by hour and day
    const byHour: Record<number, { sent: number; opened: number }> = {};
    const byDay: Record<number, { sent: number; opened: number }> = {};
    const heatmapData: Record<string, { sent: number; opened: number }> = {};

    for (const event of data || []) {
      const date = new Date(event.created_at);
      const hour = date.getHours();
      const day = date.getDay();
      const key = `${day}-${hour}`;

      // By hour
      if (!byHour[hour]) byHour[hour] = { sent: 0, opened: 0 };
      if (event.event_type === 'sent' || event.event_type === 'delivered') {
        byHour[hour].sent++;
      } else if (event.event_type === 'opened') {
        byHour[hour].opened++;
      }

      // By day
      if (!byDay[day]) byDay[day] = { sent: 0, opened: 0 };
      if (event.event_type === 'sent' || event.event_type === 'delivered') {
        byDay[day].sent++;
      } else if (event.event_type === 'opened') {
        byDay[day].opened++;
      }

      // Heatmap
      if (!heatmapData[key]) heatmapData[key] = { sent: 0, opened: 0 };
      if (event.event_type === 'sent' || event.event_type === 'delivered') {
        heatmapData[key].sent++;
      } else if (event.event_type === 'opened') {
        heatmapData[key].opened++;
      }
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      bestHours: Object.entries(byHour)
        .map(([hour, stats]) => ({
          hour: parseInt(hour),
          openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
        }))
        .filter(h => byHour[h.hour].sent >= 10)
        .sort((a, b) => b.openRate - a.openRate)
        .slice(0, 5),

      bestDays: Object.entries(byDay)
        .map(([day, stats]) => ({
          day: days[parseInt(day)],
          openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
        }))
        .sort((a, b) => b.openRate - a.openRate),

      heatmap: Object.entries(heatmapData).map(([key, stats]) => {
        const [day, hour] = key.split('-').map(Number);
        return {
          hour,
          dayOfWeek: day,
          ...stats,
          openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
        };
      }),
    };
  }

  async getLeadEngagement(leadId: string): Promise<{
    totalEmails: number;
    opened: number;
    clicked: number;
    lastOpened?: string;
    lastClicked?: string;
    engagementScore: number;
  }> {
    const { data, error } = await this.supabase
      .from('email_events')
      .select('event_type, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get lead engagement: ${error.message}`);

    const events = data || [];
    const sent = events.filter(e => e.event_type === 'sent' || e.event_type === 'delivered').length;
    const opened = events.filter(e => e.event_type === 'opened').length;
    const clicked = events.filter(e => e.event_type === 'clicked').length;

    const lastOpened = events.find(e => e.event_type === 'opened');
    const lastClicked = events.find(e => e.event_type === 'clicked');

    // Calculate engagement score (0-100)
    let engagementScore = 0;
    if (sent > 0) {
      const openRate = opened / sent;
      const clickRate = clicked / Math.max(opened, 1);
      engagementScore = Math.min(100, Math.round((openRate * 50) + (clickRate * 50)));
    }

    return {
      totalEmails: sent,
      opened,
      clicked,
      lastOpened: lastOpened?.created_at,
      lastClicked: lastClicked?.created_at,
      engagementScore,
    };
  }

  async getSequencePerformance(sequenceId: string): Promise<{
    enrolled: number;
    completed: number;
    completionRate: number;
    stepMetrics: { step: number; sent: number; opened: number; clicked: number }[];
  }> {
    // Get enrollments
    const { data: enrollments } = await this.supabase
      .from('sequence_enrollments')
      .select('status')
      .eq('sequence_id', sequenceId);

    const enrolled = enrollments?.length || 0;
    const completed = enrollments?.filter(e => e.status === 'completed').length || 0;

    // Get step-level metrics (would need email events tagged with step number)
    // For now, return empty array
    const stepMetrics: { step: number; sent: number; opened: number; clicked: number }[] = [];

    return {
      enrolled,
      completed,
      completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
      stepMetrics,
    };
  }

  async generateReport(dateRange: { start: string; end: string }): Promise<{
    summary: EmailMetrics;
    dailyTrends: DailyMetrics[];
    topSubjects: SubjectLinePerformance[];
    recommendations: string[];
  }> {
    const [summary, dailyTrends, topSubjects, sendTimes] = await Promise.all([
      this.getOverallMetrics(dateRange),
      this.getDailyMetrics(30),
      this.getSubjectLinePerformance(10),
      this.getBestSendTimes(),
    ]);

    // Generate recommendations
    const recommendations: string[] = [];

    if (summary.openRate < 20) {
      recommendations.push('Your open rate is below average. Consider A/B testing subject lines.');
    }

    if (summary.clickRate < 2) {
      recommendations.push('Click rate is low. Try stronger calls-to-action or better preview content.');
    }

    if (summary.bounceRate > 5) {
      recommendations.push('High bounce rate detected. Clean your email list and verify addresses.');
    }

    if (summary.unsubscribeRate > 1) {
      recommendations.push('Unsubscribe rate is high. Review email frequency and content relevance.');
    }

    if (sendTimes.bestHours.length > 0) {
      const bestHour = sendTimes.bestHours[0];
      recommendations.push(`Best send time: ${bestHour.hour}:00 (${bestHour.openRate}% open rate)`);
    }

    if (topSubjects.length > 0) {
      recommendations.push(`Top performing subject style: "${topSubjects[0].subject.substring(0, 50)}..."`);
    }

    return {
      summary,
      dailyTrends: dailyTrends.slice(-30),
      topSubjects,
      recommendations,
    };
  }

  private calculateMetrics(events: { event_type: string }[]): EmailMetrics {
    const counts: Record<string, number> = {};
    for (const event of events) {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    }

    const sent = (counts.sent || 0) + (counts.delivered || 0);
    const delivered = counts.delivered || sent;
    const opened = counts.opened || 0;
    const clicked = counts.clicked || 0;
    const bounced = counts.bounced || 0;
    const spam = counts.spam || 0;
    const unsubscribed = counts.unsubscribed || 0;

    return {
      totalSent: sent,
      totalDelivered: delivered,
      totalOpened: opened,
      totalClicked: clicked,
      totalBounced: bounced,
      totalSpam: spam,
      totalUnsubscribed: unsubscribed,

      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
      openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
      clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
      bounceRate: sent > 0 ? Math.round((bounced / sent) * 100) : 0,
      spamRate: delivered > 0 ? Math.round((spam / delivered) * 1000) / 10 : 0,
      unsubscribeRate: delivered > 0 ? Math.round((unsubscribed / delivered) * 1000) / 10 : 0,
    };
  }
}

export function createEmailAnalytics(): EmailAnalytics {
  return new EmailAnalytics();
}
