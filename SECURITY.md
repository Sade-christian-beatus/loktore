# Sécurité — Loktoré

## Vulnérabilités de dépendances (état)

`npm audit` au niveau du backend (`server/`) : **0 vulnérabilité**.

Frontend :
- ✅ **esbuild** (`GHSA-67mh-4wv8-2f99`) : corrigé via `overrides: { esbuild: ^0.25 }` dans `package.json`.
- ⏳ **Vite ≤ 6.4.2** (`GHSA-4w7w-66w2-5vf9` path traversal, `fs.deny` bypass, launch-editor NTLM) : **non corrigé**.
  - Ces failles concernent **uniquement le serveur de développement Vite**. En production, l'application est **buildée en statique** et servie par nginx — Vite ne s'exécute pas, l'exposition est donc **nulle en production**.
  - Le correctif n'existe qu'à partir de **Vite 7+** (changement majeur), qui entre en conflit de peer-dependencies avec `vite-plugin-pwa`/`@vitejs/plugin-react` actuels.
  - **Action planifiée** : migration coordonnée Vite 7 + `@vitejs/plugin-react` + `vite-plugin-pwa` dans un lot dédié, avec revérification du build PWA.
  - **Atténuation en attendant** : ne pas exposer le serveur de dev (`npm run dev`) sur un réseau non fiable.

## Données de santé

Voir [`PLAN_TECHNIQUE.md` §7](./PLAN_TECHNIQUE.md#7-sécurité--conformité-réglementaire).
- Chiffrement au repos des champs médicaux : **AES-256-GCM** (`server/src/utils/crypto.js`).
- Journalisation des accès aux dossiers : modèle `MedicalAccessLog`.
- Conformité **CIL** (loi n°001-2021/AN) : à finaliser avant mise en production avec de vraies données patients.
