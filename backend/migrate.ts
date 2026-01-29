import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://hvulzgcqdwurrhaebhyy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running database migration...');
  
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  
  // Split by semicolons and filter empty statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📝 Found ${statements.length} SQL statements`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 60)}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      if (error) {
        console.error(`❌ Error:`, error);
        // Continue on error (some statements might already exist)
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.error(`❌ Exception:`, err);
    }
  }
  
  console.log('\n✨ Migration complete!');
}

runMigration().catch(console.error);
