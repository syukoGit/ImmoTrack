# Architecture Decision Records

Chaque décision architecturale non triviale est consignée ici (format court : contexte,
décision, conséquences). Un ADR accepté n'est pas réécrit : il est remplacé par un nouvel ADR qui
le déclare obsolète.

| ADR                                                        | Décision                                                             | Statut  |
| ---------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| [001](ADR-001-modular-monolith-hexagonal.md)               | Monolithe modulaire + architecture hexagonale                        | Accepté |
| [002](ADR-002-nextjs-vercel.md)                            | Next.js / Vercel comme adaptateur web et runtime V1                  | Accepté |
| [003](ADR-003-supabase-postgres-auth.md)                   | Supabase pour PostgreSQL + Auth, accès DB confiné à l'infrastructure | Accepté |
| [004](ADR-004-agent-ingestion-contract.md)                 | Ingestion agent via contrat JSON versionné et idempotent             | Accepté |
| [005](ADR-005-deterministic-financial-calculations.md)     | Calculs financiers déterministes hors LLM                            | Accepté |
| [006](ADR-006-immutable-snapshots-and-versioned-inputs.md) | Snapshots immuables et hypothèses versionnées                        | Accepté |
