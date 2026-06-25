# Sécurité — Loktoré

## Vulnérabilités de dépendances

État : **0 vulnérabilité** (`npm audit`) côté frontend et backend.

Historique :
- esbuild (`GHSA-67mh-4wv8-2f99`) et Vite ≤ 6.4.2 (path traversal, `fs.deny` bypass) : **corrigés** par la migration **Vite 7** (`@vitejs/plugin-react` 5, `vite-plugin-pwa` 1).

## Données de santé

Voir [`PLAN_TECHNIQUE.md` §7](./PLAN_TECHNIQUE.md#7-sécurité--conformité-réglementaire).
- Chiffrement au repos des champs médicaux : **AES-256-GCM** (`server/src/utils/crypto.js`).
- Journalisation des accès aux dossiers : modèle `MedicalAccessLog`.
- Partage du dossier avec un médecin : **consentement explicite, tracé et révocable** (`RecordConsent`).
- Conformité **CIL** (loi n°001-2021/AN) : à finaliser avec un conseil juridique avant mise en production avec de vraies données patients.
