# Déploiement — Loktoré

Pile de production conteneurisée : **PostgreSQL + API (Node/Prisma) + PWA (nginx)**.
Cible : serveur (VPS/dédié) **au Burkina Faso** (cf. [`PLAN_TECHNIQUE.md` §8](./PLAN_TECHNIQUE.md#8-déploiement-hébergement-local)).

## Prérequis serveur
- Docker + Docker Compose
- Un nom de domaine pointant vers le serveur (ex. `loktore.app`) et un reverse proxy TLS en amont (Let's Encrypt) — recommandé en façade de `web`.

## Démarrage

```bash
# 1. Récupérer le code
git clone https://github.com/Sade-christian-beatus/loktore.git
cd loktore

# 2. Configurer les secrets de production
cp .env.prod.example .env.prod
#   - POSTGRES_PASSWORD : mot de passe fort
#   - JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / ENCRYPTION_KEY : openssl rand -hex 32
#   - VAPID_* : npx web-push generate-vapid-keys (notifications)
#   - CORS_ORIGIN : l'URL publique de la PWA (ex. https://loktore.app)

# 3. Construire et lancer
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 4. (Première fois) Charger les données de démonstration — optionnel
docker compose -f docker-compose.prod.yml exec api npm run db:seed
```

La PWA est servie sur le port `WEB_PORT` (8080 par défaut). nginx relaie `/api/*`
et `/socket.io/*` vers le service `api` — front et API partagent donc la même origine.

## Composition

| Service | Image | Rôle |
|---|---|---|
| `db` | postgres:16-alpine | Base, volume persistant `loktore_pgdata` |
| `api` | build `./server` | API Express ; applique `prisma migrate deploy` au démarrage |
| `web` | build `.` | Build Vite servi par nginx (+ proxy API/WS) |

## Migrations
Les migrations sont **appliquées automatiquement** au démarrage du conteneur `api`
(`prisma migrate deploy`). Les fichiers de migration sont versionnés dans
`server/prisma/migrations/`.

## Exploitation (cf. PLAN §8.2)
- **Sauvegardes** chiffrées et testées du volume `loktore_pgdata`.
- **TLS** en façade (Let's Encrypt) + redirection HTTP→HTTPS.
- **Supervision** (CPU/disque/services) et **mises à jour** de sécurité.
- Ne pas exposer le port `db` publiquement.

> ⚠️ Avant toute mise en service avec de vraies données patients : accomplir la
> **formalité CIL** (voir [`SECURITY.md`](./SECURITY.md) et PLAN §7).
