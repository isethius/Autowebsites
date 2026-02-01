/**
 * Database Checks
 *
 * Verifies Supabase connection, schema, and CRUD operations.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient as getSupabaseSingleton } from '../../utils/supabase';
import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';

const CATEGORY = 'Database';

function getSupabaseClient(): SupabaseClient | null {
  try {
    return getSupabaseSingleton();
  } catch {
    return null;
  }
}

/**
 * Check Supabase connection
 */
async function checkConnection(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  const client = getSupabaseClient();
  if (!client) {
    return createResult(CATEGORY, 'Connection', 'skip', Date.now() - start, {
      message: 'Supabase not configured',
    });
  }

  try {
    // Try a simple query to check connection
    const { error } = await client.from('leads').select('id').limit(1);

    // PGRST116 means table doesn't exist, which is a schema issue, not connection
    if (error && !error.code?.startsWith('PGRST')) {
      throw new Error(error.message);
    }

    return createResult(CATEGORY, 'Connection', 'pass', Date.now() - start);
  } catch (error: any) {
    return createResult(CATEGORY, 'Connection', 'fail', Date.now() - start, {
      message: `Connection failed: ${error.message}`,
    });
  }
}

/**
 * Check leads table schema
 */
async function checkLeadsSchema(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  const client = getSupabaseClient();
  if (!client) {
    return createResult(CATEGORY, 'Leads table schema', 'skip', Date.now() - start, {
      message: 'Supabase not configured',
    });
  }

  try {
    // Try to select with all expected columns
    const { data, error } = await client
      .from('leads')
      .select('id, business_name, website_url, email, pipeline_stage, website_score')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return createResult(CATEGORY, 'Leads table schema', 'fail', Date.now() - start, {
          message: 'Leads table does not exist',
          fixCommand: 'Run database migrations or create the leads table',
        });
      }
      throw new Error(error.message);
    }

    return createResult(CATEGORY, 'Leads table schema', 'pass', Date.now() - start, {
      details: options.verbose ? { recordCount: data?.length || 0 } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Leads table schema', 'fail', Date.now() - start, {
      message: `Schema check failed: ${error.message}`,
    });
  }
}

/**
 * Check CRUD operations with a test record
 */
async function checkCrudOperations(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  const client = getSupabaseClient();
  if (!client) {
    return createResult(CATEGORY, 'CRUD operations', 'skip', Date.now() - start, {
      message: 'Supabase not configured',
    });
  }

  const testUrl = `https://preflight-test-${Date.now()}.example.com`;
  let createdId: string | null = null;

  try {
    // CREATE
    const { data: created, error: createError } = await client
      .from('leads')
      .insert({
        business_name: 'Preflight Test Business',
        website_url: testUrl,
        industry: 'other',
        pipeline_stage: 'new',
        country: 'US',
        priority: 'low',
        emails_sent: 0,
        emails_opened: 0,
        emails_clicked: 0,
        tags: [],
        custom_fields: {},
        is_unsubscribed: false,
        decision_maker: false,
      })
      .select()
      .single();

    if (createError) throw new Error(`Create failed: ${createError.message}`);
    createdId = created.id;

    // READ
    const { data: read, error: readError } = await client
      .from('leads')
      .select('*')
      .eq('id', createdId)
      .single();

    if (readError) throw new Error(`Read failed: ${readError.message}`);

    // UPDATE
    const { error: updateError } = await client
      .from('leads')
      .update({ business_name: 'Preflight Test Updated' })
      .eq('id', createdId);

    if (updateError) throw new Error(`Update failed: ${updateError.message}`);

    // DELETE
    const { error: deleteError } = await client
      .from('leads')
      .delete()
      .eq('id', createdId);

    if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);

    return createResult(CATEGORY, 'CRUD operations', 'pass', Date.now() - start, {
      details: options.verbose ? { operations: ['create', 'read', 'update', 'delete'] } : undefined,
    });
  } catch (error: any) {
    // Cleanup attempt
    if (createdId) {
      try {
        await client.from('leads').delete().eq('id', createdId);
      } catch {}
    }

    return createResult(CATEGORY, 'CRUD operations', 'fail', Date.now() - start, {
      message: error.message,
    });
  }
}

/**
 * Check database statistics
 */
async function checkDatabaseStats(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  const client = getSupabaseClient();
  if (!client) {
    return createResult(CATEGORY, 'Database stats', 'skip', Date.now() - start, {
      message: 'Supabase not configured',
    });
  }

  try {
    const { count, error } = await client
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST116') {
        return createResult(CATEGORY, 'Database stats', 'skip', Date.now() - start, {
          message: 'Leads table not found',
        });
      }
      throw new Error(error.message);
    }

    return createResult(CATEGORY, 'Database stats', 'pass', Date.now() - start, {
      message: `${count || 0} leads in database`,
      details: { totalLeads: count || 0 },
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Database stats', 'fail', Date.now() - start, {
      message: error.message,
    });
  }
}

/**
 * Export all database checks
 */
export const databaseChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'Connection',
    required: true,
    run: checkConnection,
  },
  {
    category: CATEGORY,
    name: 'Leads table schema',
    required: true,
    run: checkLeadsSchema,
  },
  {
    category: CATEGORY,
    name: 'CRUD operations',
    required: true,
    run: checkCrudOperations,
  },
  {
    category: CATEGORY,
    name: 'Database stats',
    required: false,
    run: checkDatabaseStats,
  },
];
