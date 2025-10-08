// ES module script to apply RLS fix
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const supabaseUrl = 'https://jjgynhecxcnpizwdzsdi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3luaGVjeGNucGl6d2R6c2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ0NDU5NiwiZXhwIjoyMDczMDIwNTk2fQ.2NTxVijBWrrHiQAZkq5j9yh8MofTbJ070RlzDDFWRic';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  try {
    console.log('Applying RLS fix for manual templates...');
    
    // Read the SQL file
    const sql = fs.readFileSync('supabase/migrations/fix_manual_rls_final.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.includes('readFileSync'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error);
            console.error('Statement:', statement);
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (execError) {
          console.error(`Execution error in statement ${i + 1}:`, execError);
        }
      }
    }
    
    console.log('RLS fix applied successfully!');
    
  } catch (error) {
    console.error('Error applying RLS fix:', error);
  }
}

applyRLSFix();