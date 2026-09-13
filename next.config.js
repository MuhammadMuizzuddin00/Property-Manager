const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {};

// Sentry build-time options — safe no-ops if SENTRY_ORG/SENTRY_PROJECT
// aren't set (error monitoring itself still works via the DSN alone;
// these two just enable nicer stack traces via source map upload).
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
