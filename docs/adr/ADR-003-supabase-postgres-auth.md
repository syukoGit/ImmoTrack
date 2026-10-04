# ADR-003 — Supabase pour PostgreSQL et Auth ; accès DB confiné à l'infrastructure

- Statut : accepté
- Date : 2026-10-03

## Contexte

Il faut une base relationnelle managée (contraintes, transactions, JSONB) et une
authentification pour un administrateur unique, au coût le plus bas possible.

## Décision

- **PostgreSQL managé par Supabase** est la source de vérité. Les migrations sont des fichiers
  SQL versionnés (`supabase/migrations`), en PostgreSQL standard pour s'appliquer aussi sur un
  PostgreSQL vierge (CI, tests d'intégration, autre hébergeur).
- L'application accède à la base **uniquement côté serveur**, par connexion PostgreSQL directe
  (`pg`, pooler Supabase en mode transaction), depuis les repositories de
  `@immotrack/infrastructure`. Pas de client Supabase Data API pour les données métier.
- **RLS activée sur toutes les tables, sans politique**, et privilèges révoqués pour les rôles
  `anon`/`authenticated` : l'API Data de Supabase ne donne accès à rien (défense en profondeur).
- **Supabase Auth** (email/mot de passe, inscription désactivée) pour l'administrateur ; seul
  l'email `ADMIN_EMAIL` est autorisé. Sessions SSR par cookies via `@supabase/ssr`, avec la clé
  **publiable** uniquement. La clé `service_role` n'est utilisée nulle part.
- L'identité Supabase est isolée derrière `SupabaseIdentityAdapter` (infrastructure).

## Conséquences

- Vendor lock-in limité aux adaptateurs : migrer vers un autre PostgreSQL = changer
  `DATABASE_URL` ; remplacer l'Auth = un nouvel adaptateur d'identité.
- Les invariants restent dans le domaine ; les contraintes SQL (FK/UNIQUE/CHECK) les doublent
  sans les remplacer. Pas de logique métier dans des triggers.
- Les migrations sont appliquées explicitement (`supabase db push`), jamais au build.
