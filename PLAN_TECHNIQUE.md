# Plan technique — Loktoré

Document de référence pour la conception et la construction de l'application.
Il accompagne le [README](./README.md) et sert de base aux décisions techniques.

---

## 1. Objectifs et contraintes

**Objectif produit** : rapprocher patients et professionnels de santé au Burkina Faso
via une application mobile simple, fiable et accessible.

**Contraintes du contexte à intégrer dès la conception :**

- Terminaux hétérogènes, souvent d'entrée de gamme → application **légère**.
- Connexion parfois lente ou intermittente → **mode hors-ligne partiel** (cache PWA).
- Coûts de données mobiles → minimiser le poids des pages et des images.
- Alphabétisation numérique variable → interface **épurée**, **multilingue**.
- Données médicales **sensibles** → sécurité et confidentialité prioritaires.

Ces contraintes motivent le choix d'une **PWA** plutôt qu'une app native lourde pour
le MVP.

---

## 2. Choix techniques (et pourquoi)

| Besoin | Choix | Justification |
|---|---|---|
| Interface | React + Vite | Écosystème mûr, build rapide, réutilisable en React Native plus tard |
| Style | Tailwind CSS | Développement rapide, cohérence visuelle, faible poids final |
| Navigation | React Router | Standard, simple, supporte le lazy-loading des pages |
| Installation/offline | vite-plugin-pwa | Manifeste + service worker + cache automatiques |
| Carte | Leaflet + OpenStreetMap | Gratuit, sans clé API, léger (vs Google Maps facturé) |
| Backend + base | Supabase **auto-hébergé** (Docker) | PostgreSQL + Auth + Storage + Realtime, RLS, sur serveur local |
| Traductions | react-i18next | Standard i18n, chargement des langues à la demande |
| Notifications | Web Push / FCM | Rappels de RDV et de traitement |
| Hébergement | **Datacenter au Burkina Faso** (VPS/serveur dédié) | Données de santé conservées sur le territoire (voir §7.2) |

> **Décision retenue : hébergement local au Burkina Faso.** Les données de santé
> restent sur le territoire national, ce qui évite la problématique du transfert
> international et simplifie la conformité CIL.

### Backend retenu : PostgreSQL + API Node.js

Stack serveur précise, plus simple à exploiter qu'un Supabase auto-hébergé :

| Brique | Choix | Rôle |
|---|---|---|
| Runtime / framework | **Node.js + Express** | API REST simple et éprouvée (Fastify possible si perf prioritaire) |
| Base de données | **PostgreSQL** | Relationnel robuste, adapté aux données structurées de santé |
| Accès base & migrations | **Prisma** | Schéma typé, migrations versionnées, requêtes sûres |
| Authentification | **JWT** + hachage **argon2/bcrypt** | Comptes maison (pas de service tiers), sessions par jeton |
| Validation des entrées | **Zod** | Valide chaque requête, réduit les failles |
| Temps réel (messagerie) | **Socket.IO** | Messages patient–médecin en direct |
| Sécurité HTTP | **helmet, cors, rate-limit** | Bonnes pratiques par défaut |

> La sécurité par ligne qu'offrait le RLS de Supabase est ici assurée **dans la couche
> service** : chaque requête vérifie que l'utilisateur authentifié a le droit d'accéder
> à la ressource (son propre dossier, ses patients suivis…). À implémenter rigoureusement
> car c'est le garde-fou central pour les données médicales.

---

## 3. Architecture générale

```
┌─────────────────────────────────────────────┐
│              CLIENT (PWA React)              │
│  Pages · Composants · Service Worker (cache) │
└───────────────┬─────────────────────────────┘
                │  HTTPS / Realtime
┌───────────────▼─────────────────────────────┐
│   SERVEUR LOCAL — Datacenter Burkina Faso    │
│   (VPS ou serveur dédié, accès root/Docker)  │
│                                              │
│   API Node.js (Express) ── Socket.IO         │
│   Auth JWT · Prisma · validation Zod         │
│              │                               │
│        PostgreSQL  +  stockage fichiers      │
└───────────────┬─────────────────────────────┘
                │
     ┌──────────┴──────────┬──────────────┐
   Leaflet/OSM         FCM/Web Push     API IA (V2)
   (cartes)            (notifications)  (assistant)
```

> Le **frontend** (fichiers statiques de la PWA) peut être servi par le même serveur
> local derrière un reverse proxy (nginx), ou par un hébergeur local. Il ne contient
> aucune donnée médicale.

Trois rôles d'utilisateur, avec des accès distincts :

- **Patient** : son dossier, ses RDV, recherche de structures, messagerie.
- **Professionnel de santé** : agenda, dossiers des patients suivis, messagerie.
- **Structure** (hôpital/pharmacie) : fiche, horaires de garde, disponibilités.

---

## 4. Modèle de données (PostgreSQL)

Tables principales et champs clés :

**`profiles`** — extension de `auth.users`
- `id` (uuid, = auth.users.id), `role` (patient | doctor | facility),
  `full_name`, `phone`, `avatar_url`, `preferred_language`, `created_at`

**`medical_records`** — dossier médical (1–1 avec un patient)
- `id`, `patient_id` → profiles, `blood_type`, `allergies` (text[]),
  `chronic_conditions` (text[]), `history` (jsonb), `updated_at`

**`doctors`** — informations professionnelles
- `id` → profiles, `speciality`, `facility_id`, `bio`, `is_online`,
  `consultation_fee`

**`facilities`** — hôpitaux et pharmacies
- `id`, `name`, `type` (hospital | pharmacy), `latitude`, `longitude`,
  `address`, `phone`, `on_duty` (bool), `on_duty_until` (timestamp)

**`appointments`** — rendez-vous
- `id`, `patient_id`, `doctor_id`, `scheduled_at`, `status`
  (pending | confirmed | cancelled | done), `reason`, `created_at`

**`messages`** — messagerie patient–médecin
- `id`, `conversation_id`, `sender_id`, `content`, `read_at`, `created_at`

**`medications`** — disponibilité et prix
- `id`, `facility_id`, `name`, `price`, `in_stock`, `updated_at`

**`health_content`** — contenus de sensibilisation
- `id`, `category` (nutrition | hygiène | santé sexuelle…), `title`, `body`,
  `media_url`, `language`, `published_at`

> Relations résumées : un `profile` patient possède un `medical_record` et plusieurs
> `appointments` ; un `doctor` est rattaché à une `facility` ; les `messages` relient
> patient et médecin.

---

## 5. Écrans (pages)

| Page | Contenu | Rôle |
|---|---|---|
| Connexion / Inscription | Identifiants, connexion sociale | Tous |
| Accueil | Recherche, catégories, médecins en ligne, conseils, pharmacies de garde | Patient |
| Recherche médecin | Liste filtrable par spécialité, prise de RDV | Patient |
| Carte | Structures de santé / pharmacies proches (Leaflet) | Patient |
| Mon dossier | Infos de base, antécédents, allergies | Patient |
| Mes rendez-vous | À venir, passés, annulation | Patient |
| Messagerie | Conversations avec les médecins | Patient/Médecin |
| Conseils santé | Articles et vidéos multilingues | Tous |
| Profil / Réglages | Langue, notifications, déconnexion | Tous |
| Agenda médecin | RDV reçus, dossiers des patients suivis | Médecin |

Le prototype actuel couvre **Connexion** et **Accueil**.

---

## 6. API REST (Node.js / Express)

L'API expose des routes versionnées sous `/api/v1`. Toutes les routes sensibles
exigent un **jeton JWT** valide et vérifient les droits dans la couche service.
Esquisse des principaux points d'accès :

**Authentification**
- `POST /auth/register` — créer un compte (rôle patient par défaut)
- `POST /auth/login` — connexion, renvoie un JWT
- `POST /auth/refresh` — renouveler le jeton
- `POST /auth/logout` — invalider la session

**Dossier médical** (patient propriétaire uniquement)
- `GET /me/medical-record` — lire son dossier
- `PUT /me/medical-record` — mettre à jour (antécédents, allergies…)

**Rendez-vous**
- `GET /appointments` — lister les siens (filtre statut/date)
- `POST /appointments` — réserver un créneau
- `PATCH /appointments/:id` — confirmer / annuler

**Médecins & structures**
- `GET /doctors` — liste filtrable (spécialité, en ligne)
- `GET /facilities?lat=..&lng=..&type=pharmacy&onDuty=true` — recherche de proximité

**Messagerie** (REST + temps réel via Socket.IO)
- `GET /conversations/:id/messages` — historique
- `POST /conversations/:id/messages` — envoyer (diffusé en direct par Socket.IO)

**Contenus santé**
- `GET /health-content?lang=mooré&category=nutrition` — articles/vidéos filtrés

> Conventions : réponses JSON, codes HTTP standards, pagination par `?page&limit`,
> validation des corps de requête avec **Zod**. Les opérations sensibles futures
> (paiement, IA) passeront par des services serveur dédiés, jamais côté client.

### Contrôle d'accès (remplace le RLS de Supabase)

Sans RLS automatique, l'autorisation est **explicite dans chaque service** :

- un patient n'accède qu'aux ressources dont il est propriétaire (`patient_id` = id du
  jeton) ;
- un médecin n'accède qu'aux dossiers des patients qui l'ont explicitement autorisé ;
- un middleware `requireRole(...)` filtre par rôle ; un helper `assertOwnership(...)`
  vérifie la propriété avant toute lecture/écriture.

C'est le point le plus critique de l'API : toute route touchant un dossier médical
doit passer ce contrôle.

---

## 7. Sécurité & conformité réglementaire

Les dossiers médicaux sont des **données sensibles**. Au Burkina Faso, leur traitement
est encadré par la **loi n°001-2021/AN du 30 mars 2021** portant protection des
personnes à l'égard du traitement des données à caractère personnel (qui a remplacé la
loi n°010-2004). L'autorité de contrôle est la **CIL — Commission de l'Informatique et
des Libertés** (site officiel : `cil.bf`).

> ⚠️ Cette section synthétise les obligations principales pour orienter la conception.
> Elle **ne remplace pas un conseil juridique** : la qualification exacte du traitement
> et les formalités doivent être validées avec la CIL et un juriste local avant la mise
> en production.

### 7.1 Formalité préalable auprès de la CIL

Tout traitement de données personnelles doit, avant sa mise en œuvre, faire l'objet
d'une formalité auprès de la CIL (déclaration normale, déclaration simplifiée, demande
d'avis ou demande d'autorisation). **Pour Loktoré, le régime le plus probable est la
demande d'autorisation préalable**, car le traitement porte sur des données de santé
et peut inclure, selon les évolutions, des données biométriques, des transferts à
l'étranger ou des dispositifs d'aide à la décision (IA). À confirmer avec la CIL.

À retenir : la mise en service ne peut intervenir qu'après accomplissement de cette
formalité ; le récépissé n'exonère pas des responsabilités prévues par la loi.

### 7.2 Hébergement et transfert international — décision retenue

**Décision : hébergement local au Burkina Faso.** Les données de santé étant
sensibles, les conserver sur le territoire national évite la problématique du
transfert international (qui aurait exigé une autorisation spécifique et un
consentement renforcé pour un envoi vers un pays sans niveau de protection adéquat).

Conséquences :

- Backend et base de données sur un **serveur situé au Burkina Faso** (voir §8 pour
  les hébergeurs et les exigences d'exploitation).
- Le **frontend** (PWA) ne contenant pas de données médicales, son hébergement est
  moins contraint, mais on le placera aussi en local par simplicité et cohérence.
- Tout recours futur à un service étranger (ex. API d'IA en V2, notifications via un
  service tiers) devra être réévalué au regard du transfert de données : anonymiser /
  pseudonymiser ce qui sort, ou choisir une alternative locale.

### 7.3 Obligations du responsable de traitement

Loktoré sera **responsable de traitement**. Obligations principales :

- **Consentement** explicite et tracé de la personne concernée.
- **Licéité et légitimité** : finalité déterminée, explicite et légitime.
- **Information** claire de l'utilisateur (qui traite, pourquoi, quels droits).
- **Sécurité et confidentialité** des données.
- **Minimisation** : ne collecter que le strict nécessaire.
- **Durée de conservation** limitée et déclarée ; au-delà, suppression.
- **Droits des personnes** : accès, rectification, opposition, effacement.
- Avec tout **sous-traitant** (hébergeur, prestataire), conclure une **convention**
  précisant les opérations autorisées et le sort des données en fin de contrat.
- Possibilité (recommandée ici) de désigner un **Délégué à la Protection des Données
  (DPO)**.

### 7.4 Mesures techniques à implémenter

- **Contrôle d'accès applicatif** (équivalent du RLS, voir §6) : implémenté dans la
  couche service — un patient n'accède qu'à ses données ; un médecin uniquement aux
  dossiers des patients l'ayant autorisé.
- **Chiffrement en transit** (HTTPS/TLS partout) et **au repos** pour les champs
  sensibles. Les données de santé permettant l'identification doivent être codées
  avant toute transmission.
- **Consentement granulaire** au partage d'un dossier avec un professionnel, tracé et
  révocable.
- **Journalisation** des accès aux dossiers médicaux (qui, quand, quoi).
- **Authentification forte** et gestion fine des rôles.
- **Sauvegardes** chiffrées et plan de restauration.

### 7.5 Sanctions encourues (pour mémoire)

Le non-respect expose à des sanctions administratives (avertissement, mise en demeure,
injonction de cesser le traitement, retrait d'autorisation) et à des **amendes de
2 à 100 millions de FCFA** selon la gravité, voire à une interdiction de gérer des
traitements et à des poursuites pénales. La conformité est donc autant un enjeu
juridique qu'un argument de **confiance** pour les utilisateurs et partenaires.

---

## 8. Déploiement (hébergement local)

**Principe retenu** : les données (et idéalement le frontend) sont hébergées sur un
**serveur situé au Burkina Faso**, avec accès root / Docker pour pouvoir installer
Supabase auto-hébergé ou une base PostgreSQL + API.

### 8.1 Type d'offre à viser

Pour auto-héberger le backend, il faut un **VPS** ou un **serveur dédié** (pas un
hébergement mutualisé cPanel, qui ne permet pas Docker ni un service Postgres dédié).
Quelques fournisseurs disposant d'un datacenter au Burkina Faso (à comparer en direct,
demander un devis et vérifier les offres VPS/dédié) :

- **IKA Cloud** (`ikacloud.bf`) — datacenter à Ouagadougou, redondance électrique,
  surveillance 24/7, axé souveraineté des données.
- **E-Faso Cloud** (`e-faso.cloud`) — centres de données au Burkina Faso, met en avant
  le respect de la réglementation locale, paiement Orange Money / Moov Money.
- **G-Cloud gouvernemental** (`cloud.gov.bf`) — infrastructure cloud de l'État ;
  piste intéressante vu le caractère d'intérêt public du projet (à explorer via un
  partenariat institutionnel).
- Autres hébergeurs locaux (Nindohost, FasoCloud, 001.africa…) : vérifier qu'ils
  proposent bien du VPS/dédié avec datacenter **au Burkina Faso** (certains routent
  depuis l'étranger — à exclure pour les données de santé).

> ⚠️ Attention : des offres « africaines » hébergent en réalité depuis l'Europe ou
> l'Afrique du Sud (ex. routage depuis Lisbonne/Johannesburg). Cela resterait un
> **transfert international**. Vérifier la localisation physique réelle des serveurs.

### 8.2 Exigences d'exploitation (à ne pas sous-estimer)

L'auto-hébergement transfère vers vous des responsabilités qu'un cloud managé assurait :

- **Sauvegardes** chiffrées, automatiques et testées (restauration vérifiée), avec une
  copie sur un second site local.
- **Disponibilité** : onduleur/redondance électrique et lien internet de secours — le
  datacenter local doit garantir un SLA (ex. 99,9 %).
- **Sécurité serveur** : pare-feu, mises à jour, durcissement, accès SSH restreint.
- **Supervision** : monitoring (CPU, disque, services) et alertes.
- **Maintenance** : une personne responsable de l'exploitation (interne ou prestataire).

### 8.3 Pipeline

- **Frontend** : build Vite → servi par nginx sur le serveur local (ou hébergeur local).
- **Backend** : conteneurs Docker (Supabase) ou service Postgres + API ; migrations de
  base versionnées dans le dépôt Git.
- **Domaines** : `e-loktore.bf` / `loktore.app` à raccorder ; certificat TLS (Let's
  Encrypt).
- **CI** : GitHub Actions pour lint + build à chaque PR (phase 2).

---

## 9. Phases de réalisation

**Phase 1 — MVP frontend** (le plus rapide à montrer)
- Tous les écrans du pitch deck en PWA, avec données de démo.
- Installable, responsive, multilingue de base (FR + 1 langue).
- *Livrable* : démo cliquable, sans backend.

**Phase 2 — Backend & comptes**
- Supabase : auth, profils, dossiers médicaux, rendez-vous, RLS.
- Connexion des écrans aux vraies données.

**Phase 3 — Géolocalisation**
- Carte Leaflet, recherche de proximité, pharmacies de garde.

**Phase 4 — Messagerie & RDV temps réel**
- Realtime, notifications, confirmation/annulation de RDV.

**Phase 5 — Multilingue & contenus**
- Traductions complètes, contenus de sensibilisation, vidéos.

**Phase 6 — Urgences & assistant IA**
- Mise en relation/localisation urgences ; assistant de suivi et rappels.

---

## 10. Décisions à confirmer

1. ✅ **Hébergement des données de santé** : **local au Burkina Faso** (décidé).
   Reste à choisir l'hébergeur (datacenter local, VPS/dédié — voir §8).
2. **Formalité CIL** : confirmer le régime applicable (très probablement demande
   d'autorisation préalable, vu les données de santé) — voir §7.1.
3. ✅ **Forme du backend** : **PostgreSQL + API Node.js (Express)** avec Prisma, JWT
   et Socket.IO (décidé).
4. **DPO** : désigner un Délégué à la Protection des Données dès le départ ?
5. Connexion sociale : quels fournisseurs (Google, Facebook…) ? (à pondérer : certains
   impliquent des échanges avec des services étrangers).
6. Première langue locale à intégrer après le français (Mooré ? Dioula ?).
7. Modèle de monétisation activé dès le MVP ou plus tard (freemium, commissions) ?

> Les points 1 et 2 conditionnent la mise en production avec de vraies données. Le 1
> est tranché ; le 2 doit être traité tôt, idéalement avec un conseil juridique local
> et un échange direct avec la CIL.

---

*Document vivant — à mettre à jour au fil des décisions et de l'avancement.*
