// Simple script to verify Supabase connection and check tables
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvulzgcqdwurrhaebhyy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase connection...');
  
  // Try to query profiles table (will fail if doesn't exist)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('⚠️  Profiles table does not exist yet');
    console.log('📝 You need to run the schema.sql in Supabase SQL Editor');
    console.log('👉 Go to: https://supabase.com/dashboard/project/hvulzgcqdwurrhaebhyy/editor');
    console.log('👉 Copy/paste schema.sql and execute');
  } else {
    console.log('✅ Profiles table exists!');
    console.log('Data:', data);
  }
  
  // Check designs table
  const { data: designs, error: designError } = await supabase
    .from('designs')
    .select('*')
    .limit(1);
  
  if (designError) {
    console.log('⚠️  Designs table does not exist yet');
  } else {
    console.log('✅ Designs table exists!');
  }
}

checkDatabase();
