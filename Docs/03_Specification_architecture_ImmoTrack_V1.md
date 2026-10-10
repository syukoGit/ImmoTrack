# ImmoTrack V1

## Spécification d’architecture

Architecture hexagonale / Clean Architecture et règles de dépendance

Version 1.0 — 3 octobre 2026

| Champ | Valeur |
| --- | --- |
| Style cible | Architecture hexagonale dans un monolithe modulaire. |
| Priorité | Maintenabilité, testabilité, observabilité, faible coût d’exploitation. |
| Vendor lock-in | Confiné aux adaptateurs : Supabase, Vercel et ChatGPT ne sont pas des dépendances du domaine. |
| Évolution | Possibilité de remplacer l’ingestion ChatGPT, la DB ou l’hébergement sans casser les règles métier. |

## 1. Vue d’ensemble

```text
                         +---------------------------+
                         |      ChatGPT Work / IA      |
                         +-------------+-------------+
                                       |
                              Adapter entrant Agent
                                       |
+-------------------+       +---------v---------+       +-------------------+
|  Navigateur admin | ----> |   Application     | ----> |  Ports sortants    |
|  Next.js / React  | HTTP  |   Use Cases       |       | Repositories, etc. |
+-------------------+       +---------+---------+       +---------+---------+
                                       |                           |
                                       v                           v
                              +------------------+          +------------------+
                              |      Domain      |          | Infrastructure   |
                              | Entités / règles |          | Postgres/Auth    |
                              +------------------+          | Logs / IDs       |
                                                            +------------------+
```

## 2. Règle fondamentale de dépendance

Toutes les dépendances de code pointent vers l’intérieur. Le domaine ignore l’existence de Next.js, Supabase, Vercel, ChatGPT, HTTP et PostgreSQL. L’application connaît le domaine et définit les ports dont elle a besoin. L’infrastructure et la présentation implémentent ou appellent ces ports.

| Couche | Contient | Ne contient pas |
| --- | --- | --- |
| Domain | Entités, value objects, politiques métier, calculateurs purs, erreurs métier. | I/O, DTO HTTP, SQL, SDK, composants React. |
| Application | Use cases, commandes/requêtes, ports, orchestration transactionnelle. | Détails Supabase, composants UI, requêtes SQL concrètes. |
| Adapters inbound | Route handlers, contrôleurs, presenters, mapping DTO → commande. | Règles financières ou déduplication métier. |
| Adapters outbound | Repositories Postgres, auth provider, logger, clock, UUID. | Décisions métier. |
| Composition root | Assemblage des implémentations et injection des dépendances. | Règles fonctionnelles. |

## 3. Bounded contexts / modules

| Contexte | Agrégat / concepts | Dépendances autorisées |
| --- | --- | --- |
| Search Operations | SearchRun, SourceRun, AgentEvent | Criteria, Listing ingestion via application services. |
| Property Catalog | Listing, ListingSource, Snapshot | Aucune dépendance vers Evaluation au niveau domaine. |
| Evaluation | EvaluationInput, Evaluation, ScoreBreakdown | Lit les données utiles via ports/application. |
| Criteria | SearchCriteriaVersion, zones, thresholds | Indépendant. |
| Identity/Audit | Actor, AuditEvent | Cross-cutting via adapters/services. |

## 4. Flux architecturaux

### 4.1 Flux agent → ingestion

1. L’adaptateur HTTP reçoit le payload agent.
2. Le schema contractuel valide syntaxe et types.
3. Le contrôleur construit une commande IngestAgentBatch.
4. Le use case vérifie idempotence, résout la source et ouvre/actualise le SourceRun.
5. Le normaliseur produit des valeurs de domaine sûres.
6. Le service de déduplication interroge les ports de lecture nécessaires.
7. Les repositories enregistrent listing/snapshot dans une transaction lorsque requis.
8. Le use case déclenche le recalcul si les champs déterminants ont changé.
9. Les événements techniques et métier sont corrélés au run.
10. Un presenter transforme le résultat en réponse HTTP.

### 4.2 Flux UI → modification d’hypothèses

1. Le formulaire UI valide superficiellement les champs pour l’ergonomie.
2. Le serveur revalide systématiquement le contrat.
3. Le use case CreateEvaluationInput crée une nouvelle version immuable des hypothèses.
4. Le moteur de calcul produit une Evaluation liée à cette version.
5. La fiche bien lit la dernière évaluation et permet d’accéder aux versions précédentes.

## 5. Patterns retenus

| Pattern | Usage |
| --- | --- |
| Repository | Abstraction de la persistance par agrégat / besoin applicatif. |
| Use Case / Application Service | Point d’entrée métier testable pour chaque action significative. |
| Value Object | Money, Percentage, Surface, PostalCode, SourceReference, CanonicalUrl. |
| Domain Policy | Règles de scoring, rapprochement, transitions de statut. |
| Outbox logique (option V1.1) | Découpler recalculs/notifications si besoin de traitements asynchrones. |
| ADR | Tracer les choix : Supabase, stratégie d’ingestion, déduplication, calculs monétaires. |
| Idempotency Key | Rendre les imports agent rejouables et sûrs. |

## 6. Composition du code

```text
packages/domain/src/
  listing/
    entities/Listing.ts
    value-objects/Surface.ts
    policies/ListingStatusPolicy.ts
  evaluation/
    value-objects/Money.ts
    calculators/cashFlow.ts
    calculators/yield.ts
    policies/scoringPolicy.ts

packages/application/src/
  ingestion/use-cases/IngestAgentBatch.ts
  ingestion/ports/ListingRepository.ts
  ingestion/ports/IngestionRequestRepository.ts
  evaluation/use-cases/RecalculateEvaluation.ts
  shared/ports/Clock.ts
  shared/ports/IdGenerator.ts

packages/infrastructure/src/
  postgres/PostgresListingRepository.ts
  postgres/PostgresSearchRunRepository.ts
  auth/SupabaseIdentityAdapter.ts
  logging/PinoLoggerAdapter.ts

apps/web/src/
  app/(authenticated)/...
  app/api/v1/agent-ingestion/route.ts
  server/composition/createContainer.ts
  server/http/mapErrorToResponse.ts
```

## 7. Architecture de données

- PostgreSQL est la source de vérité persistante.
- Les snapshots sont append-only ; une correction utilisateur crée une nouvelle donnée/version plutôt qu’une réécriture silencieuse de l’historique observé.
- Les données brutes utiles peuvent être conservées en JSONB, mais les champs utilisés pour filtrage et calcul sont normalisés en colonnes ou projections dédiées.
- Les contraintes DB (FK, UNIQUE, CHECK) complètent les invariants du domaine ; elles ne les remplacent pas.
- Les migrations sont versionnées dans Git et testées sur une base locale avant production.

## 8. Architecture d’authentification et autorisation

- Utilisateur humain : Supabase Auth, session SSR sécurisée, accès administrateur unique en V1.
- Agent : credential distinct de l’utilisateur humain, révocable et rotatif. La première V1 peut utiliser une page d’ingestion technique avec secret dédié afin de rester compatible avec un navigateur agent ; cette décision doit être isolée derrière AgentAuthenticator.
- Ne jamais utiliser la clé service_role dans le navigateur.
- RLS et permissions DB configurées en défense en profondeur.
- Prévoir une migration ultérieure vers OAuth/MCP ou API machine-to-machine si le canal agent évolue.

## 9. Observabilité

| Signal | Exigence |
| --- | --- |
| Logs | JSON structuré, level, timestamp, correlationId, runId, sourceCode, eventType. |
| Métriques applicatives | Durée run, annonces vues/créées/mises à jour/rejetées, erreurs par source. |
| Audit | Actions administrateur modifiant hypothèses, statut ou données. |
| Erreurs | Code stable + message sûr côté UI ; stack et cause dans logs serveur. |
| Traçabilité | Possibilité de partir d’un run et retrouver chaque ingestion, listing et évaluation liés. |

## 10. Qualité et conventions

- TypeScript en mode strict ; éviter any et casts non justifiés.
- ESLint + Prettier ; ordre d’imports stable ; règles de frontières entre packages.
- Nommage métier explicite plutôt que générique : IngestAgentBatch, RecalculateEvaluation, FindDuplicateCandidates.
- Fonctions courtes ; side effects confinés aux adaptateurs.
- Pas de singleton global mutable pour le domaine.
- Pas de logique métier dans les composants React, Route Handlers, repositories ou migrations.
- Commentaires réservés aux raisons non évidentes, pas à la paraphrase du code.
- PR petites et verticales ; chaque modification métier significative accompagnée de tests.

## 11. Résilience et performance

- Ingestion batchée avec limite configurable afin d’éviter les timeouts serverless.
- Idempotence obligatoire pour les retries.
- Indexes sur source_reference, canonical_hash, city/postal_code, observed_at et clés de run.
- Transactions limitées aux groupes d’écritures nécessitant atomicité.
- Pas de traitement lourd synchrone non borné dans une requête HTTP ; si le volume augmente, introduire une queue/outbox sans modifier le domaine.

## 12. ADR initiaux à créer

| ADR | Décision |
| --- | --- |
| ADR-001 | Monolithe modulaire + architecture hexagonale plutôt que microservices. |
| ADR-002 | Next.js/Vercel comme adaptateur web et runtime V1. |
| ADR-003 | Supabase pour PostgreSQL + Auth ; accès DB confiné à infrastructure. |
| ADR-004 | Ingestion ChatGPT/agent via contrat JSON versionné et idempotent. |
| ADR-005 | Calculs financiers déterministes hors LLM. |
| ADR-006 | Snapshots immuables des annonces et versionnement des hypothèses. |

## 13. Chemin d’évolution

- Remplacer ChatGPT Work par des agents API : nouvel adaptateur entrant, cas d’usage inchangés.
- Remplacer Supabase par PostgreSQL managé ailleurs : nouveaux adaptateurs/reconfiguration, domaine inchangé.
- Ajouter un worker/queue : déplacer les traitements asynchrones derrière un port JobScheduler.
- Ajouter multi-utilisateur : étendre Identity et ownership sans réécrire les calculateurs.
- Extraire un microservice seulement si un besoin opérationnel réel apparaît (charge, cycle de vie ou ownership distinct).
