# ADR-001 — Monolithe modulaire et architecture hexagonale

- Statut : accepté
- Date : 2026-10-03

## Contexte

ImmoTrack V1 a un seul utilisateur, un faible volume (quelques centaines d'annonces par jour)
et un objectif de coût minimal. Les règles métier (déduplication, historisation, calculs
financiers, scoring) doivent pourtant rester testables, explicables et indépendantes des
fournisseurs (Supabase, Vercel, ChatGPT), susceptibles d'être remplacés.

## Décision

- Un **monolithe modulaire** déployé comme une seule application Next.js, découpé en packages
  pnpm : `domain`, `application`, `infrastructure`, `contracts`, `test-utils`, `apps/web`.
- **Architecture hexagonale** : le domaine ne dépend de rien ; l'application définit des ports ;
  l'infrastructure les implémente ; `apps/web` fournit les adaptateurs entrants et le
  composition root.
- Les modules métier (`search-runs`, `listings`, `deduplication`, `snapshots`, `evaluation`,
  `criteria`, `ingestion`, `identity`) sont des dossiers cohérents dans chaque couche plutôt que
  des packages séparés, pour limiter la cérémonie tant qu'un seul développeur fait évoluer le code.
- Les frontières sont **vérifiées automatiquement** (dependency-cruiser en CI, dépendances pnpm
  strictes, domaine compilé sans types Node/DOM).

## Alternatives écartées

- **Microservices** : coût d'exploitation, latence et complexité de déploiement injustifiés pour
  un utilisateur et un faible volume.
- **Monolithe Next.js non structuré** (logique dans les Route Handlers/composants) : rapide au
  départ, mais rend les calculs non testables isolément et couple le métier au framework.
- **Un package par module métier** : frontières plus fortes, mais multiplie la configuration ;
  reconsidérable si un module gagne un cycle de vie propre.

## Conséquences

- Les use cases se testent en mémoire, en millisecondes, sans base ni réseau.
- Un peu plus de code d'assemblage (ports, mapping DTO ↔ commande, composition root).
- Extraire un module en service reste possible le jour où un besoin opérationnel réel apparaît
  (charge, ownership distinct), sans réécrire le domaine.
