<div align="center">

# 🩺 LOKTORÉ

### Votre santé à portée de main

Application de santé numérique pour le Burkina Faso : prise de rendez-vous,
dossiers médicaux, géolocalisation des centres de santé et pharmacies de garde,
communication patient–médecin et sensibilisation multilingue.

[![Statut](https://img.shields.io/badge/statut-en%20développement-yellow)]()
[![Licence](https://img.shields.io/badge/licence-à%20définir-lightgrey)]()
[![PWA](https://img.shields.io/badge/type-PWA-green)]()

</div>

---

## 📖 À propos

De nombreux patients au Burkina Faso peinent à obtenir des informations claires sur
leur état de santé et à communiquer efficacement avec les médecins, tandis que les
structures de santé sont engorgées. **Loktoré** comble ces lacunes avec une plateforme
mobile intuitive qui rapproche patients et professionnels de santé.

Le choix technique de départ est une **PWA** (Progressive Web App) : installable depuis
le navigateur, légère, fonctionnant sur des terminaux variés et sans dépendre du Play
Store — adapté au contexte local. Le code reste réutilisable pour une future version
React Native.

## ✨ Fonctionnalités

| Fonctionnalité | Description | Phase |
|---|---|---|
| Prise de rendez-vous | Réserver en ligne avec le médecin de son choix | MVP |
| Dossier médical | Informations de base, antécédents, allergies | MVP |
| Localisation | Centres de santé et pharmacies de garde les plus proches | MVP |
| Médicaments | Disponibilité et prix | V1 |
| Messagerie | Communication directe patient–médecin | V1 |
| Urgences | Être joint et localisé par les services d'urgence | V1 |
| Sensibilisation | Contenus santé multilingues (Français, Mooré, Dioula, Bissa, Fulfudé…) | V1 |
| Assistant IA | Suivi médical, rappels et recommandations | V2 |

## 🛠️ Stack technique

- **Frontend** : React + Vite, Tailwind CSS, React Router, PWA (vite-plugin-pwa)
- **Cartographie** : Leaflet + OpenStreetMap (gratuit, sans clé)
- **Backend & base** : PostgreSQL + API Node.js (Express, Prisma, JWT, Socket.IO)
- **Internationalisation** : react-i18next
- **Notifications** : Web Push / Firebase Cloud Messaging
- **Hébergement** : **datacenter au Burkina Faso** (VPS/serveur dédié) — données de
  santé conservées sur le territoire national

> Les choix sont justifiés en détail dans [`PLAN_TECHNIQUE.md`](./PLAN_TECHNIQUE.md).

## 📂 Structure du projet

```
loktore/
├── public/
│   └── manifest.json          # Manifeste PWA
├── src/
│   ├── main.jsx               # Point d'entrée
│   ├── App.jsx                # Routeur principal
│   ├── pages/                 # Connexion, Accueil, Médecins, Carte, Profil…
│   ├── components/            # Composants réutilisables
│   ├── services/              # Appels API (Supabase)
│   ├── hooks/                 # Hooks personnalisés
│   ├── i18n/                  # Traductions
│   └── data/                  # Données de démonstration
├── server/                    # API Node.js (Express + Prisma + PostgreSQL)
├── PLAN_TECHNIQUE.md
└── README.md
```

## 🚀 Démarrage

> Prérequis : [Node.js](https://nodejs.org) 18+ et npm.

```bash
# 1. Cloner le dépôt
git clone https://github.com/Sade-christian-beatus/loktore.git
cd loktore

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# puis renseigner les clés Supabase dans .env

# 4. Lancer en développement
npm run dev
```

Variables d'environnement attendues (`.env`) :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 🗺️ Feuille de route

- [ ] **MVP** — Écrans du pitch deck en PWA + données de démo
- [ ] **Backend** — Comptes, dossiers médicaux, rendez-vous (Supabase)
- [ ] **Géolocalisation** — Carte des structures de santé et pharmacies de garde
- [ ] **Messagerie & RDV** — Communication patient–médecin en temps réel
- [ ] **Multilingue** — Contenus de sensibilisation traduits
- [ ] **Urgences & IA** — Services d'urgence et assistant de suivi

## 🤝 Contribution

Les contributions sont les bienvenues. Forkez le dépôt, créez une branche
(`git checkout -b feature/ma-fonctionnalite`), committez, puis ouvrez une Pull Request.

## 🔐 Données de santé & conformité

Loktoré manipule des données médicales **sensibles**, encadrées au Burkina Faso par la
**loi n°001-2021/AN du 30 mars 2021** et la **CIL** (Commission de l'Informatique et des
Libertés). Le traitement de données de santé requiert vraisemblablement une **autorisation
préalable de la CIL**, et l'hébergement hors du pays constitue un transfert international
soumis à conditions. Chiffrement, consentement, minimisation et localisation des données
sont traités dès la conception — voir la section dédiée du
[plan technique](./PLAN_TECHNIQUE.md#7-sécurité--conformité-réglementaire).

> Cette synthèse ne remplace pas un conseil juridique : valider les formalités avec la
> CIL avant toute mise en production avec de vraies données patients.

## 📜 Licence

À définir (MIT recommandée pour un projet ouvert).

## 📬 Contact

- 🌐 www.e-loktore.bf
- 📱 www.loktore.app
- ☎️ (+226) 56 12 18 18 / 62 29 18 18

---

<div align="center">
<i>Loktoré — parce que votre santé mérite ce qu'il y a de mieux.</i>
</div>
