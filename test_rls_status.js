// Test script to check current RLS status
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjgynhecxcnpizwdzsdi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3luaGVjeGNucGl6d2R6c2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ0NDU5NiwiZXhwIjoyMDczMDIwNTk2fQ.2NTxVijBWrrHiQAZkq5j9yh8MofTbJ070RlzDDFWRic';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSStatus() {
  try {
    console.log('Testing RLS status for manual_templates...');
    
    // Test 1: Check if we can query the table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'manual_templates' });
    
    if (tableError) {
      console.error('Error getting table info:', tableError);
    } else {
      console.log('Table info:', tableInfo);
    }
    
    // Test 2: Try to insert a test record as a regular user would
    console.log('Testing insert operation...');
    const { data: insertData, error: insertError } = await supabase
      .from('manual_templates')
      .insert({
        manual_url: 'test/manual.pdf',
        parsed_text: 'Test manual content',
        uploaded_by: '00000000-0000-0000-0000-000000000000', // Test user ID
        practical_title: 'Test Practical',
        practical_number: 1,
        unit_code: 'TEST100',
        subject: 'Test Subject'
      });
    
    if (insertError) {
      console.error('Insert error (expected):', insertError);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
    } else {
      console.log('Insert successful:', insertData);
    }
    
    // Test 3: Check current policies
    console.log('Checking current RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies', { table_name: 'manual_templates' });
    
    if (policyError) {
      console.error('Error getting policies:', policyError);
    } else {
      console.log('Current policies:', policies);
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

testRLSStatus();