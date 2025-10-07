// Sentry server-side configuration
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out development errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes("Non-Error promise rejection")) {
        return null;
      }
    }
    return event;
  },
});
