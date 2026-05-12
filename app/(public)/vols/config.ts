export interface VolPageConfig {
  slug: string;
  volParam: string;       // mot-clé qui matche le nom du vol dans la BDD
  heroImage: string;      // chemin dans /public
  season: 'Standard' | 'Hiver';
}

export const VOL_PAGES: Record<string, VolPageConfig> = {
  'cret-du-loup': {
    slug: 'cret-du-loup',
    volParam: 'loup',
    heroImage: '/loup.jpg',
    season: 'Hiver',
  },
  'beauregard': {
    slug: 'beauregard',
    volParam: 'beauregard',
    heroImage: '/hiver-hero.jpg',
    season: 'Hiver',
  },
};
