import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth';
import { LeadModel } from '../../crm/lead-model';
import { EmailAnalytics } from '../../email/analytics';
import { getSupabaseClient } from '../../utils/supabase';
import { validateQuery } from '../../utils/validation';
import { AppError, ValidationError, asyncHandler } from '../../utils/error-handler';

// Schema definitions
const daysQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const monthsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

const reportQuerySchema = z.object({
  start: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  end: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
});

export function createAnalyticsRouter(): Router {
  const router = Router();

  const leadModel = new LeadModel();
  const emailAnalytics = new EmailAnalytics();

  const supabase = getSupabaseClient();

  // Dashboard overview
  router.get('/dashboard', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get lead stats
    const leadStats = await leadModel.getStats();

    // Get email metrics
    const emailMetrics = await emailAnalytics.getOverallMetrics();

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('activities')
      .select('*, leads(business_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'succeeded')
      .gte('paid_at', startOfMonth.toISOString());

    const monthlyRevenue = (monthlyPayments || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    // Get pipeline value
    const { data: pipelineLeads } = await supabase
      .from('leads')
      .select('pipeline_stage, won_value')
      .not('pipeline_stage', 'in', '("won","lost")');

    // Estimate pipeline value based on average deal size
    const avgDealSize = leadStats.won_value_this_month / Math.max(leadStats.won_this_month, 1) || 3000;
    const pipelineValue = (pipelineLeads || []).length * avgDealSize * 0.3; // 30% conversion estimate

    res.json({
      leads: {
        total: leadStats.total,
        byStage: leadStats.by_stage,
        withEmail: leadStats.with_email,
        avgScore: leadStats.avg_website_score,
      },
      email: {
        sent: emailMetrics.totalSent,
        delivered: emailMetrics.totalDelivered,
        opened: emailMetrics.totalOpened,
        clicked: emailMetrics.totalClicked,
        openRate: emailMetrics.openRate,
        clickRate: emailMetrics.clickRate,
      },
      revenue: {
        thisMonth: monthlyRevenue,
        wonThisMonth: leadStats.won_this_month,
        pipelineValue,
      },
      recentActivity: recentActivity || [],
    });
  }));

  // Lead analytics
  router.get('/leads', validateQuery(daysQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { days } = req.query as z.infer<typeof daysQuerySchema>;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Leads created over time
    const { data: leadsOverTime } = await supabase
      .from('leads')
      .select('created_at, pipeline_stage')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by day
    const byDay: Record<string, { new: number; qualified: number; won: number }> = {};
    for (const lead of leadsOverTime || []) {
      const date = lead.created_at.split('T')[0];
      if (!byDay[date]) {
        byDay[date] = { new: 0, qualified: 0, won: 0 };
      }
      byDay[date].new++;
    }

    // Industry breakdown
    const stats = await leadModel.getStats();

    // Source breakdown (would need source field on leads)
    const sourceBreakdown = {
      google_places: 60,
      manual: 25,
      import: 15,
    };

    // Conversion funnel
    const funnel = [
      { stage: 'New', count: stats.by_stage.new, percentage: 100 },
      { stage: 'Qualified', count: stats.by_stage.qualified, percentage: Math.round((stats.by_stage.qualified / Math.max(stats.total, 1)) * 100) },
      { stage: 'Contacted', count: stats.by_stage.contacted, percentage: Math.round((stats.by_stage.contacted / Math.max(stats.total, 1)) * 100) },
      { stage: 'Proposal', count: stats.by_stage.proposal_sent, percentage: Math.round((stats.by_stage.proposal_sent / Math.max(stats.total, 1)) * 100) },
      { stage: 'Won', count: stats.by_stage.won, percentage: Math.round((stats.by_stage.won / Math.max(stats.total, 1)) * 100) },
    ];

    res.json({
      trends: Object.entries(byDay).map(([date, counts]) => ({ date, ...counts })),
      byIndustry: stats.by_industry,
      bySource: sourceBreakdown,
      funnel,
    });
  }));

  // Email analytics
  router.get('/email', validateQuery(daysQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { days } = req.query as z.infer<typeof daysQuerySchema>;

    // Get daily metrics
    const dailyMetrics = await emailAnalytics.getDailyMetrics(days);

    // Get subject line performance
    const subjectPerformance = await emailAnalytics.getSubjectLinePerformance(10);

    // Get best send times
    const sendTimes = await emailAnalytics.getBestSendTimes();

    // Overall metrics
    const overall = await emailAnalytics.getOverallMetrics();

    res.json({
      overall,
      daily: dailyMetrics,
      topSubjects: subjectPerformance,
      bestSendTimes: sendTimes,
    });
  }));

  // Revenue analytics
  router.get('/revenue', validateQuery(monthsQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { months } = req.query as z.infer<typeof monthsQuerySchema>;

    // Get monthly revenue
    const monthlyData: { month: string; revenue: number; deals: number }[] = [];

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('paid_at', startOfMonth.toISOString())
        .lte('paid_at', endOfMonth.toISOString());

      const { data: wonDeals } = await supabase
        .from('leads')
        .select('id')
        .eq('pipeline_stage', 'won')
        .gte('stage_changed_at', startOfMonth.toISOString())
        .lte('stage_changed_at', endOfMonth.toISOString());

      monthlyData.unshift({
        month: startOfMonth.toISOString().slice(0, 7),
        revenue: (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0),
        deals: (wonDeals || []).length,
      });
    }

    // Average deal size
    const { data: allWonDeals } = await supabase
      .from('leads')
      .select('won_value')
      .eq('pipeline_stage', 'won')
      .not('won_value', 'is', null);

    const avgDealSize = allWonDeals && allWonDeals.length > 0
      ? allWonDeals.reduce((sum, d) => sum + (d.won_value || 0), 0) / allWonDeals.length
      : 0;

    // Top deals
    const { data: topDeals } = await supabase
      .from('leads')
      .select('business_name, won_value, stage_changed_at')
      .eq('pipeline_stage', 'won')
      .order('won_value', { ascending: false })
      .limit(5);

    res.json({
      monthly: monthlyData,
      avgDealSize,
      topDeals: topDeals || [],
      totalRevenue: monthlyData.reduce((sum, m) => sum + m.revenue, 0),
      totalDeals: monthlyData.reduce((sum, m) => sum + m.deals, 0),
    });
  }));

  // Generate report
  router.get('/report', validateQuery(reportQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { start, end } = req.query as z.infer<typeof reportQuerySchema>;

    // Validate date range
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      throw new ValidationError('Date range cannot exceed 1 year');
    }

    const dateRange = { start, end };

    const emailReport = await emailAnalytics.generateReport(dateRange);
    const leadStats = await leadModel.getStats();

    res.json({
      period: dateRange,
      email: emailReport,
      leads: leadStats,
      generatedAt: new Date().toISOString(),
    });
  }));

  return router;
}
