// Environment variable validation
export function validateEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    throw new Error('Invalid Supabase URL format');
  }

  // Validate that we have a secure beta password in production
  if (process.env.NODE_ENV === 'production' && process.env.BETA_ACCESS_PASSWORD === 'taika') {
    console.warn('WARNING: Using default beta password in production. Please set BETA_ACCESS_PASSWORD environment variable.');
  }

  return true;
}

// Call this at application startup
export function initializeEnvironment() {
  try {
    validateEnvironment();
    console.log('✅ Environment validation passed');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    // In Edge Runtime, we can't use process.exit(), so we'll just log the error
    // The application will continue but with warnings
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 CRITICAL: Environment validation failed in production!');
    }
  }
}
