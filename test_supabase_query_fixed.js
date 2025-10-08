// Test script to verify the Supabase query fix with correct credentials
import { createClient } from '@supabase/supabase-js';

// Use the same fallback values as the backend API
const supabaseUrl = process.env.SUPABASE_URL || 'https://jjgynhecxcnpizwdzsdi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3luaGVjeGNucGl6d2R6c2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ0NDU5NiwiZXhwIjoyMDczMDIwNTk2fQ.2NTxVijBWrrHiQAZkq5j9yh8MofTbJ070RlzDDFWRic';

// For frontend testing, we need the anon key
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3luaGVjeGNucGl6d2R6c2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDQ1OTYsImV4cCI6MjA3MzAyMDU5Nn0._d3G0bYaK1x2QnJFqJeX7SkZe2e-cQr0g7pf0JD6q1w';

console.log('🚀 Testing Supabase query with maybeSingle()...');
console.log(`Supabase URL: ${supabaseUrl}`);

// Test session ID from the successful test
const sessionId = '550e8400-e29b-41d4-a716-446655440000';
console.log(`Session ID: ${sessionId}`);

async function testQuery() {
  try {
    // Test with anon key (frontend client)
    console.log('\n[TEST 1] Testing with anon key (frontend simulation)...');
    const frontendClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: data1, error: error1 } = await frontendClient
      .from('drafts')
      .select('id, session_id, user_id, draft, status, created_at, updated_at')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error1) {
      console.error(`[TEST 1] Query error: ${error1.code} - ${error1.message}`);
    } else if (!data1) {
      console.log('[TEST 1] No draft found with this session ID');
      console.log('✅ Test 1 passed - maybeSingle() handled missing data correctly');
    } else {
      console.log('[TEST 1] Draft found successfully:');
      console.log('  - ID:', data1.id);
      console.log('  - Status:', data1.status);
      console.log('  - Created at:', data1.created_at);
      console.log('  - Has draft content:', !!data1.draft);
      console.log('✅ Test 1 passed - maybeSingle() worked correctly');
    }

    // Test with service role key (backend simulation)
    console.log('\n[TEST 2] Testing with service role key (backend simulation)...');
    const backendClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { data: data2, error: error2 } = await backendClient
      .from('drafts')
      .select('id, session_id, user_id, draft, status, created_at, updated_at')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error2) {
      console.error(`[TEST 2] Query error: ${error2.code} - ${error2.message}`);
    } else if (!data2) {
      console.log('[TEST 2] No draft found with this session ID');
      console.log('✅ Test 2 passed - maybeSingle() handled missing data correctly');
    } else {
      console.log('[TEST 2] Draft found successfully:');
      console.log('  - ID:', data2.id);
      console.log('  - Status:', data2.status);
      console.log('  - Created at:', data2.created_at);
      console.log('  - Has draft content:', !!data2.draft);
      console.log('✅ Test 2 passed - maybeSingle() worked correctly');
    }

    // Test what would happen with .single() (should fail if no data)
    console.log('\n[TEST 3] Testing with .single() to compare behavior...');
    try {
      const { data: data3, error: error3 } = await frontendClient
        .from('drafts')
        .select('id, session_id, user_id, draft, status, created_at, updated_at')
        .eq('session_id', sessionId)
        .single();

      if (error3) {
        console.error(`[TEST 3] Query error with .single(): ${error3.code} - ${error3.message}`);
        console.log('✅ Test 3 shows why .single() fails and maybeSingle() is needed');
      } else {
        console.log('[TEST 3] Draft found with .single():', !!data3);
      }
    } catch (singleError) {
      console.error(`[TEST 3] .single() threw error: ${singleError.message}`);
      console.log('✅ Test 3 confirms .single() is problematic, maybeSingle() is better');
    }

  } catch (err) {
    console.error('[TEST] Unexpected error:', err.message);
    console.log('❌ Test failed');
  }
}

// Run the test
testQuery();