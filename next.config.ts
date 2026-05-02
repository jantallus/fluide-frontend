import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Headers de sécurité appliqués à toutes les routes
const COMMON_SECURITY_HEADERS = [
  // Empêche le MIME-type sniffing (ex: exécuter un JS déguisé en image)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Contrôle les infos envoyées dans le header Referer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS pendant 1 an — ignoré en HTTP local, actif en prod Railway
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Désactive les APIs browser non utilisées (micro, caméra, géoloc…)
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Headers de sécurité communs sur toutes les routes
        source: "/(.*)",
        headers: COMMON_SECURITY_HEADERS,
      },
      {
        // Pages intégrables en iframe : autorise uniquement le site Fluide
        source: "/(booking|bons-cadeaux)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://www.fluide-parapente.fr",
          },
        ],
      },
      {
        // Toutes les autres pages restent non-iframables
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