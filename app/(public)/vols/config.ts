export interface VolPageConfig {
  slug: string;
  volParam: string;
  heroImage: string;
  season: 'Standard' | 'Hiver';
  duration: string;
  priceFrom: string;
  description: string[];   // paragraphes marketing
  highlights: string[];    // infos clés (bullets)
}

export const VOL_PAGES: Record<string, VolPageConfig> = {
  'cret-du-loup': {
    slug: 'cret-du-loup',
    volParam: 'loup',
    heroImage: '/loup.jpg',
    season: 'Hiver',
    duration: '12 à 15 min',
    priceFrom: 'À partir de 85 €',
    description: [
      'Découvrez une aventure aérienne unique avec le vol de Crêt du Loup, une expérience idéale pour les skieurs et snowboarders expérimentés souhaitant prendre un peu plus de hauteur. Avec un décollage situé à 1 850 m d\'altitude et un impressionnant dénivelé de 800 m, ce vol vous promet des sensations fortes et des souvenirs mémorables.',
      'Le vol de Crêt du Loup vous offre une perspective spectaculaire sur la chaîne des Aravis et les paysages enneigés de La Clusaz. À bord de votre parapente, vous aurez la chance d\'admirer des panoramas à couper le souffle tout en ressentant l\'exaltation du vol libre.',
    ],
    highlights: [
      'Décollage à 1 850 m — dénivelé 800 m',
      'Accès par le télésiège du Crêt du Loup',
      'Pour skieurs et snowboarders confirmés',
      'Poids maximum : 110 kg',
      'Moniteur diplômé d\'État',
    ],
  },

  'beauregard': {
    slug: 'beauregard',
    volParam: 'beauregard',
    heroImage: '/hiver-hero.jpg',
    season: 'Hiver',
    duration: 'À définir',
    priceFrom: 'À définir',
    description: [],
    highlights: [],
  },
};
