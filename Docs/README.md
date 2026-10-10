# Documentation ImmoTrack

## État au 10 octobre 2026

L'entretien de cadrage est allé jusqu'à **Q152, acceptée**. Les décisions des deux sessions sont consolidées ; aucune question posée ne reste en attente. Les documents initiaux sont réécrits autour du backend .NET et du frontend React TypeScript.

Cette révision est une **spec consolidée à relire**, accompagnée de conventions de réalisation identifiées et de preuves techniques restant à mener. Les choix utilisateur sont distingués des hypothèses de dimensionnement et des propositions ajoutées pour rendre le système implémentable.

## Documents

| Document | Usage |
| --- | --- |
| [01 — Spécification fonctionnelle](01_Specification_fonctionnelle_ImmoTrack_V1.md) | Objectif, périmètre complet, parcours, données, simulations, scores et recette produit. |
| [02 — Spécification technique](02_Specification_technique_ImmoTrack_V1.md) | Modèle persistant, contrats, tâches, idempotence, transactions, sécurité et vérification. |
| [03 — Architecture](03_Specification_architecture_ImmoTrack_V1.md) | Composants, frontières hexagonales, modules, flux et déploiement. |
| [04 — Décisions et reprise](04_Decisions_et_reprise_spec_V1.md) | Q1–152, réponses et révisions explicites ; référence pour reprendre sans refaire l'entretien. |
| [05 — Calculs et cas de référence](05_Calculs_et_cas_de_reference_V1.md) | Formules, conventions proposées, exemples et limites de calcul. |
| [06 — Faisabilité et réalisation](06_Faisabilite_et_realisation_V1.md) | Sources officielles, intégrations Work/API, chiffrage candidat, étapes et preuves restantes. |

## Socle retenu

- .NET en monolithe modulaire hexagonal, Clean Code ; React TypeScript.
- PostgreSQL, EF Core pour écritures/migrations et lectures dédiées ; worker séparé, file persistante et outbox.
- Keycloak, compte local avec MFA, BFF et jetons côté serveur.
- Stockage privé compatible S3, identités techniques distinctes pour les intégrations.
- Orchestration indépendante des environnements d'agents et des fournisseurs de modèles ; HTTP JSON versionné et adaptateurs MCP lorsque compatibles.
- VPS Docker initial, plafond infrastructure 20 €/mois hors API, sauvegardes externes et déploiement manuel après contrôles.

## Révisions importantes

La priorité à ChatGPT Work et l'interdiction des API IA sont abandonnées. Plusieurs intégrations sont prévues dès la V1, avec capacités vérifiées séparément. Le socle Next.js/Vercel/Supabase n'est plus la cible.

Les scores peuvent être provisoires : dimension inconnue notée conventionnellement 50/100, badge et part documentée visibles, classement commun avec les complets. Cela ne fabrique pas de données financières et ne lève pas les critères éliminatoires inconnus. Si toutes les dimensions actives manquent, le score est non calculable.

Le scénario dégradé conserve le crédit central. Les dépenses supplémentaires affectent le coût et le besoin de réserve. Un revenu global d'immeuble reste la référence tant que le détail est incomplet ; un détail divergent nécessite validation avant remplacement.

## Prochaine étape

Relire cette consolidation et réaliser la tranche de faisabilité T0 : intégration Work sur le compte cible, configurations API de référence et chiffrage/dimensionnement. Ne pas recommencer les Q1–152. Les paramètres propres à chaque recherche seront saisis dans l'application ; les conventions proposées du document 05 doivent être vérifiées sur les cas de recette.

Cette consolidation est destinée à la branche WIP-spec. La branche de code existante fondée sur l'ancien socle devra être revue avant réutilisation ; elle ne valide pas l'architecture .NET décrite ici.
