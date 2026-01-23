import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

console.log('SUPABASE_URL:', url);
console.log('Project ID:', url.split('.')[0]?.split('//')[1] || 'unknown');
console.log('');

if (!url || !key) {
  console.log('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log('Checking tables...\n');

  const tables = ['users', 'leads', 'activities', 'proposals', 'contracts', 'payments', 'email_events', 'email_sequences', 'sequence_enrollments', 'unsubscribes'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: exists (${data?.length || 0} rows returned)`);
    }
  }
}

check();
