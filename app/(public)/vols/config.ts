export type HighlightIcon =
  | 'Mountain' | 'Clock' | 'Weight' | 'MapPin'
  | 'Award'    | 'Ski'   | 'Snowboard' | 'Pedestrian' | 'Wind';

export interface VolHighlight {
  icon: HighlightIcon;
  text: string;
}

export interface VolPageConfig {
  slug: string;
  volParam: string;
  name: string;
  heroImage: string;
  season: 'Standard' | 'Hiver';
  duration: string;
  priceFrom: string;
  description: string[];
  highlights: VolHighlight[];
}

export const VOL_PAGES: Record<string, VolPageConfig> = {
  'cret-du-loup': {
    slug: 'cret-du-loup',
    volParam: 'loup',
    name: 'Baptême parapente — Crêt du Loup',
    heroImage: '/loup.jpg',
    season: 'Hiver',
    duration: '12 à 15 min',
    priceFrom: 'À partir de 85 €',
    description: [
      'Découvrez une aventure aérienne unique avec le vol de Crêt du Loup, une expérience idéale pour les skieurs et snowboarders expérimentés souhaitant prendre un peu plus de hauteur. Avec un décollage situé à 1 850 m d\'altitude et un impressionnant dénivelé de 800 m, ce vol vous promet des sensations fortes et des souvenirs mémorables.',
      'Le vol de Crêt du Loup vous offre une perspective spectaculaire sur la chaîne des Aravis et les paysages enneigés de La Clusaz. Vous aurez la chance d\'admirer des panoramas à couper le souffle tout en ressentant l\'exaltation du vol libre.',
    ],
    highlights: [
      { icon: 'Mountain',   text: 'Décollage à 1 850 m — dénivelé 800 m' },
      { icon: 'MapPin',     text: 'Accès par le télésiège du Crêt du Loup' },
      { icon: 'Ski',        text: 'Pour skieurs et snowboarders confirmés' },
      { icon: 'Weight',     text: 'Poids maximum : 110 kg' },
      { icon: 'Award',      text: 'Moniteur diplômé d\'État' },
    ],
  },

  'beauregard': {
    slug: 'beauregard',
    volParam: 'beauregard',
    name: 'Baptême parapente — Beauregard',
    heroImage: '/hiver-hero.jpg',
    season: 'Hiver',
    duration: 'À définir',
    priceFrom: 'À définir',
    description: [],
    highlights: [],
  },
};
