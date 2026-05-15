export type HighlightIcon =
  | 'Mountain' | 'Clock' | 'Weight' | 'MapPin'
  | 'Award'    | 'Ski'   | 'Snowboard' | 'Pedestrian' | 'Wind';

export interface VolHighlight {
  icon: HighlightIcon;
  text: string;
}

export type DescriptionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'note';      label: string; text: string }
  | { type: 'section';   title: string; paragraphs: string[] };

export interface VolPageConfig {
  slug: string;
  volParam: string;
  name: string;
  heroImage: string;
  season: 'Standard' | 'Hiver';
  denivele: string;
  statIcon?: 'Mountain' | 'Clock';
  priceFrom: string;
  backUrl?: string;
  description: DescriptionBlock[];
  highlights: VolHighlight[];
}

export const VOL_PAGES: Record<string, VolPageConfig> = {
  'cret-du-loup': {
    slug: 'cret-du-loup',
    volParam: 'loup',
    name: 'Baptême parapente — Crêt du Loup',
    heroImage: '/hiver-loup.jpg',
    season: 'Hiver',
    denivele: '800 m de dénivelé',
    priceFrom: 'À partir de 90 €',
    backUrl: 'https://www.fluide-parapente.fr/bapteme-vol-biplace/',
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
    heroImage: '/hhero2.jpg',
    season: 'Hiver',
    denivele: '500 m de dénivelé',
    priceFrom: 'À partir de 70 €',
    description: [
      {
        type: 'paragraph',
        text: 'Découvrez le parapente avec notre vol de Beauregard, une expérience emblématique et accessible à La Clusaz. Ce vol, idéal pour les novices comme pour les amateurs d\'aventure aérienne, offre un dénivelé de 500 m. Que vous soyez à ski, en snowboard ou à pied (c\'est le seul décollage accessible aux piétons), cette activité est conçue pour convenir à tous.',
      },
      {
        type: 'section',
        title: 'Une expérience unique dans les cieux de La Clusaz',
        paragraphs: [
          'Le vol de Beauregard est une invitation à ressentir une sensation incomparable : celle de flotter librement dans les airs, comme un oiseau. Avec des paysages époustouflants à contempler, cette expérience mêle sérénité et émerveillement. Pour les plus curieux, le moniteur peut même vous initier au pilotage de la voile, et pour les amateurs de sensations fortes, quelques acrobaties aériennes sont également possibles.',
          'Ce vol n\'est pas seulement une aventure ; c\'est aussi une opportunité de découvrir autrement la beauté naturelle de La Clusaz, dans un cadre spectaculaire et sécurisé.',
        ],
      },
      {
        type: 'section',
        title: 'Une accessibilité optimale pour une aventure inoubliable',
        paragraphs: [
          'Parfaitement adapté à tous, le vol de Beauregard est le moins contraignant de nos options. Grâce à des conditions météorologiques généralement plus stables sur ce site, vos chances de pouvoir voler dans de bonnes conditions sont nettement augmentées.',
          'Le rendez-vous se situe en haut de la télécabine de Beauregard, à 1 647 mètres d\'altitude, où vous serez accueilli par votre moniteur dans un cadre idéal pour un décollage en douceur. Ce vol est accessible à partir de 20 kg, ce qui le rend ouvert à un large public, y compris aux enfants prêts à vivre une expérience extraordinaire.',
          'Prêt à prendre votre envol et à vivre un moment d\'adrénaline et de contemplation ? Le vol de Beauregard vous attend pour une expérience inoubliable à seulement 70 €. Rendez-vous au sommet pour le grand saut !',
        ],
      },
    ],
    highlights: [
      { icon: 'Mountain',   text: 'Décollage à 1 647 m — dénivelé 500 m' },
      { icon: 'MapPin',     text: 'Accès par la télécabine de Beauregard' },
      { icon: 'Pedestrian', text: 'Seul décollage accessible aux piétons' },
      { icon: 'Weight',     text: 'Accessible dès 20 kg' },
      { icon: 'Award',      text: 'Moniteur diplômé d\'État' },
    ],
  },

  'aiguille': {
    slug: 'aiguille',
    volParam: 'aiguille',
    name: 'Baptême parapente — L\'Aiguille',
    heroImage: '/prestige.jpg',
    season: 'Hiver',
    denivele: '1 200 m de dénivelé',
    priceFrom: 'À partir de 160 €',
    description: [
      {
        type: 'paragraph',
        text: 'Vivez l\'expérience ultime avec le vol de l\'Aiguille, le plus haut et le plus long parcours de parapente à La Clusaz. Avec un impressionnant dénivelé de 1 200 m, ce vol est spécialement conçu pour les skieurs confirmés en quête de sensations fortes et de panoramas inoubliables.',
      },
      {
        type: 'section',
        title: 'Une aventure aérienne d\'exception',
        paragraphs: [
          'Le vol de l\'Aiguille est bien plus qu\'un simple baptême de parapente : c\'est une immersion dans les hauteurs spectaculaires des Alpes. Survolant les crêtes des Aravis, vous serez subjugué par la beauté à couper le souffle des paysages environnants. Cette expérience combine adrénaline et émerveillement, offrant des moments mémorables et hors du commun.',
          'Les amateurs de sensations fortes ne seront pas déçus : ce vol vous garantit une montée d\'adrénaline unique, idéale pour ceux qui recherchent une aventure hors norme.',
        ],
      },
      {
        type: 'section',
        title: 'Conditions d\'accès et informations pratiques',
        paragraphs: [
          'Ce vol se déroule à une altitude élevée, avec un décollage situé à 2 300 m au sommet du télésiège de l\'Aiguille. En raison des conditions météorologiques plus imprévisibles à cette hauteur, une attention particulière est accordée à la météo, notamment aux vents.',
          'Pour garantir la sécurité et la meilleure qualité de vol, l\'inscription est obligatoire par téléphone. Cela permet de choisir un créneau adapté aux conditions du jour et de vous assurer une expérience optimale.',
          'Ce vol est réservé aux skieurs confirmés, qui doivent être à l\'aise avec les exigences de la haute montagne. Prêt pour l\'aventure ? Réservez dès maintenant par téléphone et préparez-vous pour une envolée extraordinaire !',
        ],
      },
    ],
    highlights: [
      { icon: 'Mountain', text: 'Décollage à 2 300 m — dénivelé 1 200 m' },
      { icon: 'MapPin',   text: 'Accès par le télésiège de l\'Aiguille' },
      { icon: 'Ski',      text: 'Pour skieurs confirmés uniquement' },
      { icon: 'Clock',    text: 'Inscription obligatoire par téléphone' },
      { icon: 'Award',    text: 'Moniteur diplômé d\'État' },
    ],
  },

  'loupiot': {
    slug: 'loupiot',
    volParam: 'loupiot',
    name: 'Baptême parapente — Loupiot',
    heroImage: '/loupiot.jpg',
    season: 'Standard',
    denivele: '7 min de vol',
    statIcon: 'Clock',
    priceFrom: 'À partir de 70 €',
    description: [
      {
        type: 'paragraph',
        text: 'Nous nous ferons un plaisir d\'emmener votre enfant découvrir le bonheur d\'un vol en parapente au dessus de La Clusaz, une glissade paisible en toute sécurité jusqu\'à l\'atterrissage de Cortibot à 10 min à pied du centre du village. Ce vol s\'effectue uniquement en conditions calmes à 09h25. Durée du vol : 7 minutes environ.',
      },
      {
        type: 'section',
        title: 'À qui s\'adresse ce vol ?',
        paragraphs: [
          'À partir de 20 kg. La demande doit venir de votre enfant. Il doit avoir conscience qu\'il ne volera pas avec papa ou maman et qu\'il sera avec un moniteur ou une monitrice qu\'il ne connaît pas.',
          'Ce vol peut aussi être réalisé pour des adultes légers (moins de 60 kg) qu\'un plus gros dénivelé pourrait impressionner.',
        ],
      },
      {
        type: 'section',
        title: 'Comment se déroule le vol ?',
        paragraphs: [
          'Nous prendrons soin de votre enfant. Nous lui expliquerons avec des mots simples et adaptés le principe du parapente et le déroulement de son vol. Il pourra même prendre les commandes et piloter s\'il le désire. Vous le retrouverez avec un grand sourire.',
          'N\'oubliez pas, nous sommes avant tout des pères de famille.',
        ],
      },
    ],
    highlights: [
      { icon: 'MapPin',  text: 'Au départ du télésiège de Crêt de Merle à côté du cinéma' },
      { icon: 'Weight',  text: 'À partir de 20 kg (adultes légers < 60 kg)' },
      { icon: 'Award',   text: 'Moniteur diplômé d\'État' },
    ],
  },

  'decouverte': {
    slug: 'decouverte',
    volParam: 'découverte',
    name: 'Baptême parapente — Découverte',
    heroImage: '/coldesaravis.jpg',
    season: 'Standard',
    denivele: '15 min de vol',
    statIcon: 'Clock',
    priceFrom: 'À partir de 90 €',
    description: [
      {
        type: 'paragraph',
        text: '15 minutes de plané, une balade aérienne, tout en douceur. Pas de sensation de chute, ni de vide, vos pieds ne touchant plus le sol, nous vous garantissons du plaisir sans vertige !',
      },
      {
        type: 'paragraph',
        text: 'Vous êtes en parapente biplace, encadré par un pilote professionnel, moniteur de parapente diplômé, qui vous expliquera tout ce qu\'il sait pour vous faire passer un merveilleux moment. Une belle façon de découvrir la magie du parapente en toute confiance.',
      },
    ],
    highlights: [
      { icon: 'Award', text: 'Moniteur diplômé d\'État' },
    ],
  },

  'ascendance': {
    slug: 'ascendance',
    volParam: 'ascendance',
    name: 'Baptême parapente — Ascendance',
    heroImage: '/loup.jpg',
    season: 'Standard',
    denivele: '30 min de vol',
    statIcon: 'Clock',
    priceFrom: 'À partir de 130 €',
    description: [
      {
        type: 'paragraph',
        text: 'Ce vol vous permet de profiter des ascendances thermiques et de prolonger l\'expérience. Accessible aux ados et adultes (35 à 110 kg), idéal l\'après-midi lorsque les conditions sont favorables.',
      },
      {
        type: 'paragraph',
        text: 'Pour le vol en ascendances, le pilote va voler vers les zones les plus favorables aux ascendances, puis tourner dedans, afin de monter ou au moins se maintenir en altitude.',
      },
      {
        type: 'note',
        label: 'À noter :',
        text: 'les conditions aérologiques peuvent être un peu plus dynamiques et agitées que sur un vol Évasion. C\'est le prix à payer pour l\'altitude et la durée !',
      },
      {
        type: 'paragraph',
        text: 'Si vous êtes particulièrement sensibles au mal des transports, nous vous conseillons plutôt un vol découverte, pour lequel les conditions de vol seront calmes et ne vous rendront pas malade.',
      },
    ],
    highlights: [
      { icon: 'Weight', text: '35 à 110 kg' },
      { icon: 'Award',  text: 'Moniteur diplômé d\'État' },
    ],
  },

  'prestige': {
    slug: 'prestige',
    volParam: 'prestige',
    name: 'Baptême parapente — Prestige',
    heroImage: '/ascendance.jpg',
    season: 'Standard',
    denivele: '1h de vol',
    statIcon: 'Clock',
    priceFrom: 'À partir de 180 €',
    description: [],
    highlights: [],
  },
};
