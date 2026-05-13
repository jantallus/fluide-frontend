export type HighlightIcon =
  | 'Mountain' | 'Clock' | 'Weight' | 'MapPin'
  | 'Award'    | 'Ski'   | 'Snowboard' | 'Pedestrian' | 'Wind';

export interface VolHighlight {
  icon: HighlightIcon;
  text: string;
}

export type DescriptionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'section';   title: string; paragraphs: string[] };

export interface VolPageConfig {
  slug: string;
  volParam: string;
  name: string;
  heroImage: string;
  season: 'Standard' | 'Hiver';
  denivele: string;
  priceFrom: string;
  description: DescriptionBlock[];
  highlights: VolHighlight[];
}

export const VOL_PAGES: Record<string, VolPageConfig> = {
  'cret-du-loup': {
    slug: 'cret-du-loup',
    volParam: 'loup',
    name: 'Baptême parapente — Crêt du Loup',
    heroImage: '/loup.jpg',
    season: 'Hiver',
    denivele: '800 m de dénivelé',
    priceFrom: 'À partir de 90 €',
    description: [
      {
        type: 'paragraph',
        text: 'Découvrez une aventure aérienne unique avec le vol de Crêt du Loup, une expérience idéale pour les skieurs et snowboarders expérimentés souhaitant prendre un peu plus de hauteur. Avec un décollage situé à 1850 m d\'altitude et un impressionnant dénivelé de 800 m, ce vol vous promet des sensations fortes et des souvenirs mémorables.',
      },
      {
        type: 'section',
        title: 'Une immersion aérienne au cœur des Aravis',
        paragraphs: [
          'Le vol de Crêt du Loup vous offre une perspective spectaculaire sur la chaîne des Aravis et les paysages enneigés de La Clusaz. À bord de votre parapente, vous aurez la chance d\'admirer des panoramas à couper le souffle tout en ressentant l\'exaltation du vol libre.',
          'Cette expérience est parfaitement adaptée aux passionnés de glisse et aux amateurs de parapente en quête de nouvelles sensations. Si vous êtes prêt à explorer les cieux et à vivre une aventure hivernale hors du commun, ce vol saura combler vos attentes.',
        ],
      },
      {
        type: 'section',
        title: 'Accès et détails pratiques',
        paragraphs: [
          'L\'accès au site de décollage se fait facilement grâce au télésiège du Crêt du Loup, qui vous emmène rapidement au point de départ. Sur place, votre moniteur vous guidera pour une préparation optimale avant le décollage.',
          'Ce vol est ouvert aux skieurs et snowboarders confirmés, avec un poids maximum de 110 kg. Le rendez-vous se situe au sommet du télésiège du Crêt du Loup, où tout est prêt pour vous offrir une expérience inoubliable.',
          'Prêt pour le grand saut ? Le vol de Crêt du Loup est une opportunité unique de découvrir la beauté des Alpes sous un nouvel angle. Réservez dès maintenant et vivez l\'adrénaline et l\'émerveillement à 85€. Rendez-vous au sommet !',
        ],
      },
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
    denivele: 'À définir',
    priceFrom: 'À définir',
    description: [],
    highlights: [],
  },
};
