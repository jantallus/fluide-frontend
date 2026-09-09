# Parabooking Admin — Guide Claude Code

## Ce qu'est ce projet

Application Next.js (App Router) déployée sur Railway sous **admin.parabooking.app**.
Un seul déploiement sert **deux marques distinctes** et **un site public Fluide** :

| Domaine | Usage |
|---|---|
| `reservation.fluide-parapente.fr` | Site public Fluide — réservation en ligne, bons cadeaux |
| `admin.parabooking.app/fluide/*` | Backoffice Fluide (Julien, Léo) |
| `admin.parabooking.app/aravis/*` | Backoffice Aravis Parapente (Sam) |

L'API backend tourne séparément sur **api.parabooking.app** (repo `parabooking-api`).

---

## Structure des dossiers clés

```
app/
├── (public)/          → reservation.fluide-parapente.fr — pages clients Fluide
│   ├── booking/       → réservation en ligne avec Stripe
│   ├── bons-cadeaux/  → achat bons cadeaux
│   ├── vols/          → pages vitrine des formules
│   └── login/         → page de connexion partagée (admin.parabooking.app/login)
│
├── (admin)/           → backoffice Fluide
│   └── fluide/        → routes sous /fluide/* (planning, clients, moniteurs…)
│
├── (aravis-admin)/    → backoffice Aravis Parapente
│   └── aravis/        → routes sous /aravis/* (planning, demandes, moniteurs…)
│
└── api/               → routes Next.js API (proxy vers parabooking-api)

components/            → composants partagés entre les deux backoffices
hooks/                 → hooks React partagés
lib/
├── api.ts             → wrapper fetch — redirige vers /login sur 401/403
└── types.ts           → interfaces TypeScript partagées (User, CurrentUser…)
middleware.ts          → protection des routes /fluide/* et /aravis/*
```

---

## Authentification

- Le backend émet un **JWT dans un cookie HttpOnly** (`auth_token`) à la connexion
- Le JWT contient : `{ id, email, role, enseigne }`
- Le champ **`enseigne`** (`'fluide'` ou `'aravis'`) détermine vers quel backoffice l'utilisateur est redirigé
- **`role`** (`'admin'`, `'aravis'`, `'monitor'`, `'permanent'`) détermine les permissions

### Logique de redirection à la connexion

| role | enseigne | → destination |
|---|---|---|
| `admin` | `aravis` | `/aravis/planning` |
| `admin` | `fluide` | `/fluide/planning` |
| `aravis` | (aravis implicite) | `/aravis/planning` |
| `monitor` / `permanent` | — | `/fluide/planning` |

### Middleware (`middleware.ts`)

Protège `/fluide/*` et `/aravis/*`. Vérifie le cookie JWT.
Un utilisateur avec `enseigne=aravis` qui tente d'accéder à `/fluide/*` est redirigé vers `/aravis/planning`.

---

## Ce qu'il NE FAUT PAS modifier sans comprendre l'impact

### ⚠️ Pages publiques Fluide — `app/(public)/`
Ces pages sont accessibles aux **clients grand public** sur `reservation.fluide-parapente.fr`.
Toute modification peut affecter les réservations en ligne et les ventes de bons cadeaux.
Ne pas changer les routes, le layout, ni l'intégration Stripe sans test préalable.

### ⚠️ Favicon — `app/icon.png` et `app/(public)/icon.png`
- `app/icon.png` = favicon Fluide (logo rose) — fallback global
- `app/(public)/icon.png` = favicon Fluide pour le site public
- `app/(admin)/icon.tsx` et `app/(aravis-admin)/icon.tsx` = favicon PB pour les backoffices
Ne pas supprimer `app/(public)/icon.png` : cela remettrait le favicon PB sur le site client Fluide.

### ⚠️ Root layout — `app/layout.tsx`
Contient les métadonnées Fluide (`title`, favicon, Stripe script).
Le titre du layout Aravis utilise `{ absolute: '...' }` pour écraser ce template — ne pas retirer ce `absolute`.

### ⚠️ Middleware matcher — `middleware.ts`
Le matcher doit couvrir `/fluide/:path*` et `/aravis/:path*`.
Si on ajoute de nouvelles sections protégées, les ajouter ici.

---

## Backoffice Aravis — ce qui est spécifique

- Layout : `app/(aravis-admin)/layout.tsx` (server) + `app/(aravis-admin)/AravisClientLayout.tsx` (client)
- Certaines pages Aravis (`clients`, `moniteurs`, `regularisation`, `demandes`) sont des **re-exports** des pages Fluide correspondantes — elles partagent le même code
- Le backoffice Aravis a sa propre identité visuelle (fond marine `#1B2A4A`, bleu `#6CAED8`)

---

## Variables d'environnement nécessaires

```
NEXT_PUBLIC_API_URL=https://api.parabooking.app
JWT_SECRET=...            # même valeur que le backend
NEXT_PUBLIC_STRIPE_KEY=...
```

---

## Commandes utiles

```bash
npm run dev      # développement local
npm run build    # vérifier que le build TypeScript passe avant de pousser
git push         # Railway redéploie automatiquement depuis main
```

---

## Backend (repo séparé : parabooking-api)

Voir `CLAUDE.md` dans le repo `parabooking-api` pour la structure de l'API et de la base de données.
Les endpoints publics Aravis sont sous `/api/public/aravis/` (pas d'authentification requise).
