// sentry.edge.config.ts — Initialisation Sentry pour le Edge Runtime (middleware Next.js)
// Ce fichier est importé automatiquement par withSentryConfig dans next.config.ts.

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production',
  });
}
