# Démarrage rapide — Loktoré

Guide d'installation pour le développement local. La stack réelle est
**React (Vite) + Express + Prisma + PostgreSQL** (cf. [`PLAN_TECHNIQUE.md`](./PLAN_TECHNIQUE.md)).

> ℹ️ Le `README.md` mentionne encore Supabase à certains endroits (document de pitch) :
> la décision retenue est **PostgreSQL + API Node.js**. Ce guide fait foi pour le code.

## Prérequis

- [Node.js](https://nodejs.org) 18+ et npm
- [Docker](https://www.docker.com/) (pour PostgreSQL en local) — ou un PostgreSQL 16 déjà installé

## 1. Frontend (PWA)

```bash
# À la racine du projet
npm install
cp .env.example .env      # valeurs par défaut OK en dev
npm run dev               # http://localhost:3000
```

Sans backend lancé, la **connexion fonctionne en mode démo** (n'importe quels
identifiants) et les écrans s'affichent avec des données de démonstration.

## 2. Backend (API)

```bash
# 1. Démarrer PostgreSQL
docker compose up -d

# 2. Configurer et installer l'API
cd server
cp .env.example .env
#   -> renseigner JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (openssl rand -hex 32)
npm install

# 3. Créer le schéma en base + données de test
npx prisma migrate dev --name init
npm run db:seed

# 4. Lancer l'API
npm run dev               # http://localhost:4000  (santé : /health)
```

Le proxy Vite redirige automatiquement `/api/*` vers `http://localhost:4000`.
Une fois l'API et la base lancées, la connexion utilise les vrais comptes.

**Compte de test (après seed)** : `patient@loktore.bf` / `password123`

## 3. Commandes utiles

| Commande | Effet |
|---|---|
| `npm run build` (racine) | Build de production de la PWA |
| `npm run lint` (racine) | ESLint du frontend |
| `npx prisma studio` (server) | Explorateur de base de données |
| `npx prisma migrate dev` (server) | Créer/appliquer une migration |
| `npm run db:seed` (server) | (Re)charger les données de test |

## Structure

```
loktore/
├── src/                  # PWA React (pages, composants, i18n, données démo)
├── public/               # Manifeste PWA, favicon
├── server/               # API Express + Prisma + PostgreSQL
│   ├── prisma/           # schema.prisma + seed
│   └── src/
│       ├── routes/       # auth, me (dossier médical), appointments, directory
│       ├── middleware/   # requireAuth, requireRole, validate (Zod), erreurs
│       └── utils/        # jwt, password
├── docker-compose.yml    # PostgreSQL local
├── PLAN_TECHNIQUE.md
└── README.md
```

## ⚠️ Données de santé

Aucune donnée réelle de patient ne doit être utilisée tant que la conformité CIL
n'est pas validée (cf. [`PLAN_TECHNIQUE.md` §7](./PLAN_TECHNIQUE.md#7-sécurité--conformité-réglementaire)).
Les données actuelles sont fictives.
