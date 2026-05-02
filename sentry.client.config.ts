// sentry.client.config.ts — Initialisation Sentry côté navigateur (composants client)
// Ce fichier est importé automatiquement par withSentryConfig dans next.config.ts.

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Capture 10 % des transactions de performance (navigation, clics…)
    tracesSampleRate: 0.1,

    // Désactivé en développement local
    enabled: process.env.NODE_ENV === 'production',

    // Ignorer les erreurs provenant d'extensions ou de scripts tiers
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error exception captured',
    ],
  });
}
