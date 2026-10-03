# ADR-002 — Next.js / Vercel comme adaptateur web et runtime V1

- Statut : accepté
- Date : 2026-10-03

## Contexte

La V1 a besoin d'une UI d'administration, d'une API d'ingestion HTTP et d'un hébergement quasi
gratuit, sans serveur à maintenir.

## Décision

- **Next.js (App Router)** dans `apps/web` porte l'UI (React Server Components), les Route
  Handlers (`/api/v1/...`) et le composition root. Next.js est un **adaptateur** : aucun package
  métier n'en dépend.
- **Vercel** héberge l'application (Root Directory `apps/web`), runtime Node.js pour les routes
  qui accèdent à PostgreSQL.
- Les Route Handlers restent minces : `withContainer` → adaptateur HTTP (auth, limites,
  validation, mapping) → use case → présentation.
- Le proxy Next.js (`src/proxy.ts`) ne fait que rafraîchir la session et rediriger ; le contrôle
  d'accès autoritaire est refait côté serveur dans la page (`requireAdmin`).
- Toute la configuration est lue **au runtime** côté serveur (aucune variable `NEXT_PUBLIC_`) :
  un même build peut être promu entre environnements.

## Conséquences

- Coût nul à faible au volume V1 ; déploiements par PR.
- Contraintes serverless : durée d'exécution bornée (lots limités en taille et en nombre
  d'annonces), pool PostgreSQL réduit par instance, pas de traitement long synchrone. Si le volume
  augmente : port `JobScheduler` + outbox, sans toucher au domaine.
- Remplacer Vercel (conteneur Node, autre PaaS) ne touche que `apps/web` et la CI.
