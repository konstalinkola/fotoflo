import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        error: "Email and password are required" 
      }, { status: 400 });
    }

    // Create service client for authentication
    const supabase = createSupabaseServiceClient();

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return NextResponse.json({ 
        error: "Invalid email or password" 
      }, { status: 401 });
    }

    // Get user's projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, display_mode, created_at')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Failed to fetch user projects:', projectsError);
      // Don't fail the login, just return empty projects
    }

    // Create a desktop-specific JWT token
    const desktopToken = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        type: 'desktop_client',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30d' } // Desktop tokens last longer
    );

    return NextResponse.json({
      success: true,
      token: desktopToken,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || authData.user.email
      },
      projects: projects || []
    });

  } catch (error: unknown) {
    console.error('Desktop login error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// Handle token validation for desktop client
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: "No valid token provided" 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { type: string; userId: string; };
      
      if (decoded.type !== 'desktop_client') {
        return NextResponse.json({ 
          error: "Invalid token type" 
        }, { status: 401 });
      }

      // Token is valid, return user info
      const supabase = createSupabaseServiceClient();
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(decoded.userId);

      if (userError || !user) {
        return NextResponse.json({ 
          error: "User not found" 
        }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.user.id,
          email: user.user.email,
          name: user.user.user_metadata?.name || user.user.email
        },
        valid: true
      });

    } catch {
      return NextResponse.json({ 
        error: "Invalid or expired token" 
      }, { status: 401 });
    }

  } catch (error: unknown) {
    console.error('Token validation error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}



