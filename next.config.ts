import type { NextConfig } from "next";

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

export default nextConfig;