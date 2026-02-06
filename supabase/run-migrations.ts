// Run all Supabase migrations in order
// Usage: SUPABASE_SERVICE_KEY=xxx npx tsx supabase/run-migrations.ts

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvulzgcqdwurrhaebhyy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY is required. Set it as an environment variable.');
  process.exit(1);
}

const migrationsDir = join(__dirname, 'migrations');

async function executeSql(sql: string, name: string): Promise<boolean> {
  // Use the Supabase SQL API endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    // Fallback: try executing via the pg endpoint if available
    const pgResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!pgResponse.ok) {
      const errorText = await response.text();
      console.error(`  Failed: ${errorText}`);
      return false;
    }
  }

  return true;
}

async function runMigrations() {
  console.log('Running Supabase migrations...\n');

  // Get migration files sorted by name
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files:`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log('');

  for (const file of files) {
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, 'utf-8');

    console.log(`Running: ${file}...`);
    const success = await executeSql(sql, file);

    if (success) {
      console.log(`  Done: ${file}`);
    } else {
      console.error(`  Warning: ${file} may have partially failed (some statements might already exist)`);
    }
  }

  console.log('\nAll migrations processed.');
}

runMigrations().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
