// Script to apply the customization_settings migration
const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://cjlhuplhgfnybjnzvctv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbGh1cGxoZ2ZueWJqbnp2Y3R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU0MzExNiwiZXhwIjoyMDc0MTE5MTE2fQ.3nqyNCdtKqLpoELbTkl2ocP6EPOzb34-tQ3JmwT2nBg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Applying customization_settings migration...');
    
    // Add the customization_settings column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.projects 
        ADD COLUMN IF NOT EXISTS customization_settings JSONB;
      `
    });
    
    if (error) {
      console.error('Error applying migration:', error);
      return;
    }
    
    console.log('Migration applied successfully!');
    
    // Verify the column was added
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'projects')
      .eq('column_name', 'customization_settings');
    
    if (columnError) {
      console.error('Error checking columns:', columnError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ customization_settings column exists:', columns[0]);
    } else {
      console.log('❌ customization_settings column not found');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

applyMigration();
