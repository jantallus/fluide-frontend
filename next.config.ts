import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Appliqué uniquement aux pages intégrables en iframe
        source: "/(booking|bons-cadeaux)",
        headers: [
          {
            key: "Content-Security-Policy",
            // Remplacez votre-site-wordpress.com par le vrai domaine WordPress
            value: "frame-ancestors 'self' https://www.fluide-parapente.fr",
          },
        ],
      },
      {
        // Toutes les autres pages restent non-iframables (sécurité)
        source: "/((?!booking|bons-cadeaux).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

// withSentryConfig instrumente automatiquement les routes Next.js pour le tracing.
// Si NEXT_PUBLIC_SENTRY_DSN n'est pas défini, l'instrumentation reste inactive
// mais le build ne plante pas (les configs Sentry vérifient la variable avant d'appeler init()).
export default withSentryConfig(nextConfig, {
  // Désactive les logs Sentry pendant le build (réduire le bruit dans Railway)
  silent: true,

  // Désactive l'upload des source maps — aucun SENTRY_AUTH_TOKEN requis au build
  sourcemaps: {
    disable: true,
  },

  // Désactive la télémétrie Sentry (données envoyées à Sentry sur l'usage du SDK)
  telemetry: false,
});