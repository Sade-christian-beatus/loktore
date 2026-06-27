# Conformité CIL — Loktoré

Référence légale : **Loi n°001-2021/AN** du Burkina Faso portant protection des données à caractère personnel.
Autorité de contrôle : **Commission de l'Informatique et des Libertés (CIL)**.

---

## État global

| Étape | Statut | Responsable |
|---|---|---|
| Hébergement local (Burkina Faso) | ✅ Décidé & architecturé | Tech |
| Chiffrement des données sensibles | ✅ Implémenté (AES-256-GCM) | Tech |
| Traçabilité des accès dossiers | ✅ Implémenté (MedicalAccessLog) | Tech |
| Consentement explicite patient | ✅ Implémenté (RecordConsent) | Tech |
| Formalité de déclaration préalable CIL | ⚠️ **À effectuer avant production** | DPO / Fondateurs |
| Désignation d'un DPO | ⚠️ **À effectuer** | Fondateurs |
| Politique de confidentialité visible | ⚠️ À rédiger et intégrer | DPO + Design |
| Contrats sous-traitants (hébergeur) | ⚠️ À signer | Juridique |
| Plan de réponse à incident | ⚠️ À rédiger | DPO + Tech |
| Registre des activités de traitement | ⚠️ À tenir à jour | DPO |

---

## 1. Formalité de déclaration préalable CIL

La CIL exige une déclaration préalable avant tout traitement de données de santé (données sensibles, article 6 de la loi).

### Démarches

- [ ] Télécharger le formulaire de déclaration sur le site de la CIL Burkina Faso
- [ ] Identifier le responsable de traitement (personne morale / fondateur)
- [ ] Déposer le dossier auprès de la CIL (physique ou en ligne si disponible)
- [ ] Obtenir le récépissé de déclaration (obligatoire avant mise en production)
- [ ] Conserver le récépissé et le joindre au registre des activités

**Contact CIL Burkina Faso** : `www.cil.bf` — 03 BP 7024 Ouagadougou 03

---

## 2. Désignation d'un DPO (Délégué à la Protection des Données)

Recommandé pour tout organisme traitant des données de santé à grande échelle.

- [ ] Identifier et désigner formellement un DPO (interne ou externe)
- [ ] Notifier la désignation à la CIL
- [ ] Donner au DPO accès aux journaux d'accès (`MedicalAccessLog`)
- [ ] Planifier un audit de conformité annuel avec le DPO

---

## 3. Politique de confidentialité

- [ ] Rédiger une politique de confidentialité conforme (finalité, durée de conservation, droits des personnes)
- [ ] Intégrer la page `/privacy` dans l'application (lien obligatoire en pied de page)
- [ ] Mentionner explicitement le droit d'accès, de rectification, d'effacement et d'opposition
- [ ] Préciser le transfert de données : aucun transfert hors du Burkina Faso (hébergement local)
- [ ] Indiquer les coordonnées du DPO dans la politique

---

## 4. Consentement des utilisateurs

L'implémentation technique est en place (`RecordConsent`). Compléter l'expérience utilisateur :

- [ ] Afficher une bannière de consentement au premier lancement (cookies de session)
- [ ] Ajouter un consentement explicite lors de l'inscription (case à cocher, non pré-cochée)
- [ ] Permettre le retrait du consentement à tout moment depuis `/profile`
- [ ] Journaliser chaque grant/revoke avec horodatage (déjà implémenté)

---

## 5. Durées de conservation

Définir et implémenter les durées de conservation des données :

| Donnée | Durée recommandée | Implémenté |
|---|---|---|
| Dossier médical | 10 ans après dernier acte | ❌ |
| Ordonnances / ordres | 5 ans | ❌ |
| Journaux d'accès (MedicalAccessLog) | 3 ans | ❌ |
| Messages (Conversation) | Durée du suivi patient | ❌ |
| Tokens de refresh révoqués | 30 jours après révocation | ❌ |

**Action** : Implémenter un job de purge planifiée (cron ou tâche de fond) pour chaque catégorie.

---

## 6. Sécurité technique (obligations légales)

Ces points sont techniquement requis par la loi et sont en partie déjà couverts :

| Exigence | Statut | Détail |
|---|---|---|
| Chiffrement des données de santé au repos | ✅ | AES-256-GCM sur allergies, pathologies, groupe sanguin |
| Chiffrement en transit (HTTPS/TLS) | ⚠️ À configurer en prod | Let's Encrypt via nginx (config présente) |
| Contrôle d'accès basé sur les rôles | ✅ | RBAC via JWT + requireRole() |
| Authentification forte | ⚠️ Partiel | JWT + bcrypt, pas encore de 2FA |
| Journalisation des accès sensibles | ✅ | MedicalAccessLog sur chaque lecture de dossier |
| Plan de sauvegarde | ⚠️ À documenter | PostgreSQL pg_dump, pas encore automatisé |
| Plan de reprise d'activité (PRA) | ⚠️ À rédiger | Aucun PRA documenté |

---

## 7. Registre des activités de traitement

Le RGPD (et la loi CIL) exige un registre documentant chaque traitement.

- [ ] Créer et maintenir `docs/REGISTRE_TRAITEMENTS.md` listant :
  - Finalité de chaque traitement (RDV, dossier médical, messagerie, commandes, paiements)
  - Base légale (consentement, contrat, obligation légale)
  - Catégories de données traitées
  - Durées de conservation
  - Destinataires

---

## 8. Contrats avec les sous-traitants

- [ ] Contrat de prestation avec l'hébergeur local (clause de confidentialité, localisation des données)
- [ ] Contrat avec l'intégrateur Mobile Money (Orange / Moov) — préciser quelles données sont transmises
- [ ] Vérifier que les contrats incluent des clauses de notification d'incident sous 72h

---

## 9. Plan de réponse à incident

- [ ] Rédiger un plan de notification en cas de violation de données (72h vers CIL, notification aux personnes concernées)
- [ ] Définir une cellule de crise (DPO + Tech + Direction)
- [ ] Tester le plan une fois par an (exercice)

---

## Calendrier recommandé

```
Mois 1 : Désignation DPO + Dépôt dossier CIL + Rédaction politique de confidentialité
Mois 2 : Politique de confidentialité intégrée dans l'app + bannière consentement
Mois 3 : Registre des activités + durées de conservation + job de purge
Mois 4 : Contrats sous-traitants + plan PRA + premier audit interne
Avant mise en production : Récépissé CIL reçu (bloquant)
```

---

> Ce document doit être maintenu à jour par le DPO. Dernière révision : 2026-06-27.
