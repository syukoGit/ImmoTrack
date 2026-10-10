# ImmoTrack V1

## Spécification technique

Comportement du logiciel, contrats, persistance et qualité de code

Version 1.0 — 3 octobre 2026

| Champ | Valeur |
| --- | --- |
| Stack | TypeScript, Next.js App Router, PostgreSQL managé par Supabase, Supabase Auth, Vercel. |
| Style | Modular monolith, domain-centric, ports/adapters, dépendances orientées vers le domaine. |
| Déploiement | Frontend + serveur Next.js sur Vercel ; PostgreSQL/Auth sur Supabase. |
| Principe de testabilité | Domaine et application sans dépendance Next.js, Supabase, HTTP ou UI. |

## 1. Principes de conception

- Le domaine ne dépend d’aucun framework ni SDK externe.
- Les cas d’usage dépendent d’interfaces (ports) et non d’implémentations.
- Les adaptateurs sortants implémentent les ports de persistance, horloge, identifiants et logs.
- Next.js agit comme adaptateur entrant et composition root ; les Route Handlers restent minces.
- Toutes les commandes d’écriture sont idempotentes lorsque cela est possible.
- Les entrées externes sont validées à la frontière avant d’atteindre le domaine.
- Les erreurs métier sont typées et séparées des erreurs techniques.

## 2. Modules métier

| Module | Responsabilité |
| --- | --- |
| search-runs | Création/clôture des runs, suivi des sources, événements et erreurs. |
| listings | Création, normalisation, cycle de vie des biens et annonces sources. |
| deduplication | Calcul de candidats doublons, règles de rapprochement et consolidation. |
| snapshots | Historisation des changements significatifs d’une annonce. |
| evaluation | Hypothèses financières, calculs, scénarios et score explicable. |
| criteria | Zones, seuils, hypothèses par défaut, règles actives. |
| ingestion | Contrat d’entrée agent, validation, orchestration et idempotence. |
| identity | Adaptation de Supabase Auth et autorisations V1. |

## 3. Organisation du repository

```text
apps/
  web/                       # Next.js : UI, route handlers, composition root
packages/
  domain/                    # Entités, value objects, règles pures
  application/               # Cas d’usage + ports entrants/sortants
  infrastructure/            # Adaptateurs Postgres/Supabase, logging, clock, ids
  contracts/                 # DTO d’API et schemas de validation versionnés
  test-utils/                # Fixtures/builders partagés
supabase/
  migrations/                # Migrations SQL versionnées
  seed.sql                    # Données locales non sensibles
docs/
  adr/                        # Architecture Decision Records
  api/                        # Contrats et exemples
.github/workflows/            # CI
```

## 4. Dépendances autorisées

| Package | Peut dépendre de | Interdit |
| --- | --- | --- |
| domain | TypeScript standard uniquement | Next.js, Supabase, DB, React, HTTP |
| application | domain + contrats internes | Next.js, SDK Supabase, SQL concret |
| infrastructure | application + domain + libs techniques | UI React |
| contracts | validation/schema uniquement | DB, UI, cas d’usage |
| apps/web | application, infrastructure, contracts | Logique métier profonde dans routes/composants |

## 5. Modèle de données technique

| Table | Clés/champs structurants |
| --- | --- |
| search_runs | id UUID, criteria_version_id, started_at, completed_at, status, totals JSONB, correlation_id |
| search_source_runs | id, run_id, source_id, status, started_at, completed_at, metrics JSONB, error_code |
| sources | id, code, name, kind, base_url, active |
| listings | id, canonical_hash, city, postal_code, property_type, status, first_seen_at, last_seen_at |
| listing_sources | id, listing_id, source_id, source_reference, url, active, first_seen_at, last_seen_at |
| listing_snapshots | id, listing_source_id, observed_at, normalized_payload JSONB, payload_hash |
| evaluation_inputs | id, listing_id, version, source_kind, assumptions JSONB, created_at |
| evaluations | id, listing_id, input_id, calculator_version, metrics JSONB, score, score_breakdown JSONB |
| search_criteria_versions | id, version, config JSONB, active_from, created_at |
| agent_events | id, run_id, source_run_id, level, event_type, message, metadata JSONB, created_at |
| ingestion_requests | id, idempotency_key, payload_hash, status, response_summary JSONB, created_at |
| audit_events | id, actor_id, action, entity_type, entity_id, metadata JSONB, created_at |

## 6. Contrat d’ingestion agent

L’entrée est versionnée. Le contrat V1 doit être sérialisable en JSON et validé avant orchestration. Un même idempotencyKey ne doit jamais produire deux écritures métier distinctes.

```json
{
  "schemaVersion": "1.0",
  "idempotencyKey": "2026-10-03:leboncoin:batch-001",
  "runId": "uuid",
  "source": { "code": "leboncoin", "status": "SUCCESS" },
  "observedAt": "2026-10-03T06:12:00+02:00",
  "listings": [
    {
      "sourceReference": "abc123",
      "url": "https://...",
      "title": "...",
      "price": 92000,
      "surfaceM2": 41,
      "city": "Tours",
      "postalCode": "37000",
      "rawFacts": { }
    }
  ],
  "errors": []
}
```

## 7. Pipeline d’ingestion

1. Authentifier la requête technique ou la session de l’agent.
2. Vérifier la version du contrat, la taille et le schéma.
3. Vérifier l’idempotencyKey et retourner le résultat précédent en cas de répétition.
4. Normaliser les valeurs (prix, surface, ville, URL, texte, dates).
5. Calculer les clés de rapprochement et rechercher des doublons potentiels.
6. Créer ou mettre à jour le listing et son mapping source.
7. Créer un snapshot seulement si le payload normalisé diffère du dernier snapshot.
8. Planifier/exécuter le recalcul financier si les données pertinentes ont changé.
9. Écrire les événements de run et mettre à jour les compteurs.
10. Retourner un résumé structuré avec created/updated/unchanged/rejected/errors.

## 8. Déduplication

La V1 utilise une stratégie déterministe par niveaux, sans dépendre d’un LLM :

- Niveau 1 : même source + même référence source → même annonce.
- Niveau 2 : URL canonique identique → même annonce.
- Niveau 3 : rapprochement de bien par adresse normalisée + surface proche + type + nombre de pièces.
- Niveau 4 : heuristique de similarité lorsque l’adresse est absente : ville, surface, prix, texte normalisé, photos/hash si disponibles.
- Les rapprochements incertains sont enregistrés comme candidats et ne fusionnent pas automatiquement au-delà d’un seuil de sécurité.

## 9. Moteur d’évaluation

- Calculs implémentés sous forme de fonctions pures dans domain/evaluation.
- Aucun accès DB, horloge ou réseau dans les calculateurs.
- Chaque évaluation conserve calculatorVersion et inputVersion.
- Scénarios minimum : central et dégradé ; optimiste optionnel.
- Arrondis définis explicitement ; stockage des valeurs monétaires en cents ou NUMERIC selon le contexte.
- Tests de non-régression sur jeux d’exemples connus.

## 10. Gestion des erreurs

| Type | Exemple | Comportement |
| --- | --- | --- |
| ValidationError | Surface négative, URL invalide | HTTP 400, aucune écriture métier, log warning. |
| UnauthorizedError | Token/session invalide | HTTP 401/403, aucune donnée sensible retournée. |
| ConflictError | Version incompatible / collision métier | HTTP 409, code explicite. |
| DomainError | Transition de statut interdite | Erreur typée, message fonctionnel. |
| InfrastructureError | DB indisponible | HTTP 503, corrélation, retry seulement si idempotent. |
| UnexpectedError | Erreur non prévue | HTTP 500, correlationId, stack uniquement dans logs sécurisés. |

## 11. Sécurité

- Supabase Auth pour l’utilisateur administrateur ; toutes les pages métier sont protégées.
- Clés service_role et secrets exclusivement côté serveur ; jamais dans le bundle navigateur.
- RLS activée sur les tables exposées via Supabase ; accès privilégié uniquement depuis les adaptateurs serveur nécessaires.
- Ingestion agent protégée par un mécanisme dédié et révocable ; secret hashé côté serveur, rotation prévue et rate limiting.
- Payloads externes limités en taille et validés ; pas d’exécution de HTML ou scripts provenant des annonces.
- Logs nettoyés des secrets, mots de passe, tokens et contenus sensibles non nécessaires.

## 12. Tests

| Niveau | Outil / cible | Attendu |
| --- | --- | --- |
| Unitaires | Vitest | Domain + application ; rapides, déterministes, aucune I/O réelle. |
| Intégration | Vitest + PostgreSQL/Supabase local | Repositories, migrations, idempotence, transactions. |
| Composants UI | Testing Library | États critiques, formulaires, filtres. |
| End-to-end | Playwright | Login, ingestion contrôlée, fiche bien, run en erreur, recalcul. |
| Contrats | Schemas versionnés + fixtures | Compatibilité payload agent et réponses API. |

## 13. CI/CD et Definition of Done

- À chaque pull request : install verrouillée, typecheck, lint, tests unitaires, tests d’intégration, build.
- Sur branche principale : mêmes contrôles puis déploiement Vercel et migrations contrôlées.
- Aucune migration destructive automatique sans stratégie de transition.
- Couverture ciblée sur le domaine critique plutôt qu’un pourcentage artificiel ; objectif initial ≥ 80 % sur domain/application.
- Chaque décision architecturale non triviale est documentée dans un ADR.
- Tout use case comporte des tests nominal + erreurs métier importantes.
