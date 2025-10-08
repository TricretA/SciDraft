// Test script to verify the Supabase query fix
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the same configuration as the frontend
const supabase = createClient(
  'https://jjgynhecxcnpizwdzsdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3luaGVjeGNucGl6d2R6c2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDQ1OTYsImV4cCI6MjA3MzAyMDU5Nn0._d3G0bYaK1x2QnJFqJeX7SkZe2e-cQr0g7pf0JD6q1w'
);

// Test session ID from the previous test
const sessionId = '550e8400-e29b-41d4-a716-446655440000';

console.log('🚀 Testing Supabase query with maybeSingle()...');
console.log(`Session ID: ${sessionId}`);

async function testQuery() {
  try {
    console.log('[TEST] Executing query with maybeSingle()...');
    
    const { data, error } = await supabase
      .from('drafts')
      .select('id, session_id, user_id, draft, status, created_at, updated_at')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error(`[TEST] Query error: ${error.code} - ${error.message}`);
      console.log('❌ Test failed');
      return;
    }

    if (!data) {
      console.log('[TEST] No draft found with this session ID');
      console.log('✅ Test passed - maybeSingle() handled missing data correctly');
      return;
    }

    console.log('[TEST] Draft found successfully:');
    console.log('  - ID:', data.id);
    console.log('  - Status:', data.status);
    console.log('  - Created at:', data.created_at);
    console.log('  - Has draft content:', !!data.draft);
    console.log('✅ Test passed - maybeSingle() worked correctly');

  } catch (err) {
    console.error('[TEST] Unexpected error:', err.message);
    console.log('❌ Test failed');
  }
}

// Run the test
testQuery();