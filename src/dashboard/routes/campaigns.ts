import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../auth';
import { SequenceEngine, EmailSequence, SequenceStep } from '../../email/sequence-engine';
import { EmailComposer } from '../../email/composer';
import { LeadModel } from '../../crm/lead-model';
import { createClient } from '@supabase/supabase-js';

// Mock send function for now - would integrate with SendGrid
const mockSendEmail = async (to: string, subject: string, html: string, text: string) => {
  console.log(`[Mock] Sending email to ${to}: ${subject}`);
  return { messageId: `mock_${Date.now()}` };
};

export function createCampaignsRouter(): Router {
  const router = Router();

  const emailComposer = new EmailComposer({
    senderName: process.env.SENDGRID_FROM_NAME || 'AutoWebsites',
    senderCompany: 'AutoWebsites Pro',
  });

  const sequenceEngine = new SequenceEngine({
    emailComposer,
    sendEmail: mockSendEmail,
  });

  const leadModel = new LeadModel();

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  // List sequences
  router.get('/sequences', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sequences = await sequenceEngine.listSequences();
      res.json(sequences);
    } catch (error: any) {
      console.error('List sequences error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get sequence details
  router.get('/sequences/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sequence = await sequenceEngine.getSequence(req.params.id);
      if (!sequence) {
        return res.status(404).json({ error: 'Sequence not found' });
      }

      // Get enrollments
      const { data: enrollments } = await supabase
        .from('sequence_enrollments')
        .select('*, leads(business_name, email)')
        .eq('sequence_id', req.params.id)
        .order('created_at', { ascending: false })
        .limit(50);

      res.json({ sequence, enrollments: enrollments || [] });
    } catch (error: any) {
      console.error('Get sequence error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create sequence
  router.post('/sequences', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, steps } = req.body;

      if (!name || !steps || !Array.isArray(steps)) {
        return res.status(400).json({ error: 'Name and steps required' });
      }

      const sequence = await sequenceEngine.createSequence(name, steps, description);
      res.status(201).json(sequence);
    } catch (error: any) {
      console.error('Create sequence error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update sequence
  router.patch('/sequences/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, steps, is_active } = req.body;

      const { data, error } = await supabase
        .from('email_sequences')
        .update({
          name,
          description,
          steps,
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json(data);
    } catch (error: any) {
      console.error('Update sequence error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete sequence
  router.delete('/sequences/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // First cancel all enrollments
      await supabase
        .from('sequence_enrollments')
        .update({ status: 'cancelled', stop_reason: 'Sequence deleted' })
        .eq('sequence_id', req.params.id)
        .in('status', ['active', 'paused']);

      // Delete sequence
      const { error } = await supabase
        .from('email_sequences')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete sequence error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Enroll lead in sequence
  router.post('/sequences/:id/enroll', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { lead_id, start_immediately = true } = req.body;

      if (!lead_id) {
        return res.status(400).json({ error: 'lead_id required' });
      }

      const enrollment = await sequenceEngine.enrollLead(lead_id, req.params.id, {
        startImmediately: start_immediately,
      });

      res.status(201).json(enrollment);
    } catch (error: any) {
      console.error('Enroll error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Bulk enroll leads
  router.post('/sequences/:id/enroll-bulk', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { lead_ids } = req.body;

      if (!lead_ids || !Array.isArray(lead_ids)) {
        return res.status(400).json({ error: 'lead_ids array required' });
      }

      const results = { enrolled: 0, errors: [] as string[] };

      for (const leadId of lead_ids) {
        try {
          await sequenceEngine.enrollLead(leadId, req.params.id);
          results.enrolled++;
        } catch (err: any) {
          results.errors.push(`${leadId}: ${err.message}`);
        }
      }

      res.json(results);
    } catch (error: any) {
      console.error('Bulk enroll error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Pause enrollment
  router.post('/enrollments/:id/pause', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reason } = req.body;
      await sequenceEngine.pauseEnrollment(req.params.id, reason);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Pause error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Resume enrollment
  router.post('/enrollments/:id/resume', async (req: AuthenticatedRequest, res: Response) => {
    try {
      await sequenceEngine.resumeEnrollment(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Resume error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel enrollment
  router.post('/enrollments/:id/cancel', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reason } = req.body;
      await sequenceEngine.cancelEnrollment(req.params.id, reason);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Cancel error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get available templates
  router.get('/templates', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const templates = emailComposer.getAvailableTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Preview email
  router.post('/preview', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { template, variables, subject, preheader } = req.body;

      const composed = emailComposer.composeFromTemplate(
        template,
        variables || {},
        { subject, preheader }
      );

      res.json(composed);
    } catch (error: any) {
      console.error('Preview error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Send test email
  router.post('/test', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { to, template, variables, subject } = req.body;

      if (!to || !template) {
        return res.status(400).json({ error: 'to and template required' });
      }

      const composed = emailComposer.composeFromTemplate(
        template,
        variables || {},
        { subject }
      );

      const result = await mockSendEmail(to, composed.subject, composed.html, composed.text);

      res.json({ success: true, messageId: result.messageId });
    } catch (error: any) {
      console.error('Test email error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Process pending emails (would be called by worker)
  router.post('/process', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sentCount = await sequenceEngine.processNextEmails();
      res.json({ processed: sentCount });
    } catch (error: any) {
      console.error('Process error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
