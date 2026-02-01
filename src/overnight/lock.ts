import os from 'os';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../utils/supabase';
import { logger } from '../utils/logger';

const LOCK_NAME = 'overnight_scheduler';
const LOCK_TTL_MS = parseInt(process.env.OVERNIGHT_LOCK_TTL_MS || '28800000', 10); // 8 hours

function getLockOwnerId(): string {
  return `${os.hostname()}-${process.pid}-${Date.now()}`;
}

export async function acquireOvernightLock(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    logger.warn('Supabase not configured; falling back to in-memory overnight lock only');
    return getLockOwnerId();
  }

  const supabase = getSupabaseServiceClient();
  const owner = getLockOwnerId();
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS).toISOString();

  const { error: insertError } = await supabase
    .from('scheduler_locks')
    .insert({
      name: LOCK_NAME,
      locked_by: owner,
      locked_at: nowIso,
      expires_at: expiresAt,
    });

  if (!insertError) {
    return owner;
  }

  if (insertError.code !== '23505') {
    logger.error('Failed to acquire overnight lock', { error: insertError.message });
    return null;
  }

  // Attempt to take over an expired lock
  const { data, error: updateError } = await supabase
    .from('scheduler_locks')
    .update({
      locked_by: owner,
      locked_at: nowIso,
      expires_at: expiresAt,
    })
    .eq('name', LOCK_NAME)
    .lt('expires_at', nowIso)
    .select('name');

  if (updateError) {
    logger.error('Failed to update expired overnight lock', { error: updateError.message });
    return null;
  }

  return data && data.length > 0 ? owner : null;
}

export async function releaseOvernightLock(owner: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from('scheduler_locks')
    .delete()
    .eq('name', LOCK_NAME)
    .eq('locked_by', owner);

  if (error) {
    logger.warn('Failed to release overnight lock', { error: error.message });
  }
}
