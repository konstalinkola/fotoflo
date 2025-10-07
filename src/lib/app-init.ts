// Application initialization
import { initializeEnvironment } from './env-validation';

// Initialize application
export function initializeApp() {
  // Validate environment variables
  initializeEnvironment();
  
  // Log startup information
  console.log('🚀 Fotoflo application initializing...');
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Site URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://fotoflo.vercel.app'}`);
  console.log('✅ Application initialization complete');
}

// Call initialization
initializeApp();
