// Feature flags for gradual rollout and development
export const FEATURE_FLAGS = {
    FOTOFLO_AUTO_UPLOAD: process.env.NEXT_PUBLIC_ENABLE_FOTOFLO_AUTO_UPLOAD === 'true',
    WEBSITE_MODE: process.env.NEXT_PUBLIC_ENABLE_WEBSITE_MODE === 'true',
    PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
    REDIS_CACHING: process.env.NEXT_PUBLIC_ENABLE_REDIS_CACHING === 'true',
    DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  } as const;
  
  export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
    return FEATURE_FLAGS[feature];
  }
  
  export function getEnabledFeatures(): string[] {
    return Object.entries(FEATURE_FLAGS)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);
  }
  
  export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
  
  export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }