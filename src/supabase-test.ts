import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log(`URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connection by querying system tables
  const { data, error } = await supabase.from('leads').select('count').limit(1);

  if (error) {
    // Table might not exist yet, but connection works if we get certain errors
    if (error.code === '42P01') {
      console.log('✅ Supabase connected! (leads table does not exist yet - will create)');
      return true;
    }
    console.log('Connection result:', error.message);
  } else {
    console.log('✅ Supabase connected! Leads table exists.');
  }

  return true;
}

testConnection().catch(console.error);
