import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    console.log('🔍 Desktop sync test endpoint called');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅ Set' : '❌ Missing');
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        error: "Missing environment variables",
        details: {
          supabaseUrl: !!supabaseUrl,
          serviceKey: !!serviceKey
        }
      }, { status: 500 });
    }
    
    // Test Supabase connection
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });
      
      // Test a simple query
      const { error } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
        
      if (error) {
        console.log('Database test error:', error);
        return NextResponse.json({ 
          error: "Database connection failed",
          details: error.message
        }, { status: 500 });
      }
      
      console.log('✅ Database connection successful');
      
    } catch (dbError) {
      console.log('Database connection error:', dbError);
      return NextResponse.json({ 
        error: "Database connection error",
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Desktop sync test endpoint working",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Desktop sync test error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
