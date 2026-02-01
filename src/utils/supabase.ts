/**
 * Supabase Client Singleton Factory
 *
 * Centralized Supabase client creation to prevent connection pool exhaustion.
 * All modules should import clients from here instead of calling createClient directly.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;
let serviceClientInstance: SupabaseClient | null = null;

/**
 * Get the standard Supabase client (uses anon key)
 * Use for most operations with row-level security
 */
export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }
    clientInstance = createClient(url, key);
  }
  return clientInstance;
}

/**
 * Get the service role Supabase client (uses service role key)
 * Use for admin operations that bypass row-level security
 * Falls back to anon key if service role key is not available
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (!serviceClientInstance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY are required');
    }
    serviceClientInstance = createClient(url, key);
  }
  return serviceClientInstance;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

/**
 * Reset clients - for testing purposes only
 */
export function resetClients(): void {
  clientInstance = null;
  serviceClientInstance = null;
}
