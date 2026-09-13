import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  // Set to true temporarily if you need verbose Sentry SDK logs while debugging.
  debug: false,
});
