const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCollectionIdColumn() {
  try {
    console.log('Adding collection_id column to images table...');
    
    // Try to add the column using a raw SQL query
    const { data, error } = await supabase
      .from('images')
      .select('id')
      .limit(1);

    if (error && error.message.includes('collection_id')) {
      console.log('Column already exists or there was an error:', error.message);
      return;
    }

    // If we get here, the column might not exist
    console.log('Attempting to add collection_id column...');
    
    // Use the REST API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE images ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;'
      })
    });

    if (response.ok) {
      console.log('✅ Successfully added collection_id column to images table');
    } else {
      const errorText = await response.text();
      console.log('❌ Error adding column:', errorText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addCollectionIdColumn();