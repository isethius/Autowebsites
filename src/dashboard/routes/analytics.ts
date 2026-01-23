import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../auth';
import { LeadModel } from '../../crm/lead-model';
import { EmailAnalytics } from '../../email/analytics';
import { createClient } from '@supabase/supabase-js';

export function createAnalyticsRouter(): Router {
  const router = Router();

  const leadModel = new LeadModel();
  const emailAnalytics = new EmailAnalytics();

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  // Dashboard overview
  router.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
    try {
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
    } catch (error: any) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Lead analytics
  router.get('/leads', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { days = '30' } = req.query;
      const daysNum = parseInt(days as string);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

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
    } catch (error: any) {
      console.error('Lead analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Email analytics
  router.get('/email', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { days = '30' } = req.query;
      const daysNum = parseInt(days as string);

      // Get daily metrics
      const dailyMetrics = await emailAnalytics.getDailyMetrics(daysNum);

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
    } catch (error: any) {
      console.error('Email analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Revenue analytics
  router.get('/revenue', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { months = '6' } = req.query;
      const monthsNum = parseInt(months as string);

      // Get monthly revenue
      const monthlyData: { month: string; revenue: number; deals: number }[] = [];

      for (let i = 0; i < monthsNum; i++) {
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
    } catch (error: any) {
      console.error('Revenue analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate report
  router.get('/report', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ error: 'start and end dates required' });
      }

      const dateRange = { start: start as string, end: end as string };

      const emailReport = await emailAnalytics.generateReport(dateRange);
      const leadStats = await leadModel.getStats();

      res.json({
        period: dateRange,
        email: emailReport,
        leads: leadStats,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Report error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
