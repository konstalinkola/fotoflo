const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying sync_folders table migration...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_sync_folders_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL statements one by one
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        console.log('Executing:', trimmedStatement.substring(0, 50) + '...');
        
        const { data, error } = await supabase.rpc('exec', { sql: trimmedStatement });
        
        if (error) {
          console.error('❌ Statement failed:', error);
          console.error('Statement was:', trimmedStatement);
          process.exit(1);
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the table was created
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'sync_folders');
    
    if (tableError) {
      console.warn('⚠️ Could not verify table creation:', tableError.message);
    } else if (tables && tables.length > 0) {
      console.log('✅ sync_folders table confirmed to exist');
    } else {
      console.warn('⚠️ sync_folders table not found in verification query');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
