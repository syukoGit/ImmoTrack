# Contribuer à ImmoTrack

## Branches

- `main` est toujours déployable ; on n'y pousse jamais directement.
- Une branche par changement, courte et verticale : `feat/<sujet>`, `fix/<sujet>`,
  `chore/<sujet>`, `docs/<sujet>`, `refactor/<sujet>`.
- Rebase sur `main` avant merge ; merge par squash.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/fr/) :

```text
<type>(<module>): <résumé à l'impératif>

feat(ingestion): reject batches from inactive sources
fix(evaluation): round monthly payment half away from zero
chore(ci): cache Playwright browsers
```

Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.
Modules : `domain`, `application`, `infrastructure`, `contracts`, `web`, `db`, `ingestion`,
`listings`, `evaluation`, `search-runs`, `criteria`, `ci`, `docs`.

## Pull requests

- Petites et verticales : une PR = un comportement, testé de bout en bout de sa couche.
- Description : contexte, changement, impacts (migration, variable d'environnement, contrat),
  comment tester.
- Toute décision architecturale non triviale ajoute un ADR (`docs/adr`).
- Toute évolution du contrat d'ingestion : schéma Zod + `pnpm contracts:generate` + doc
  `docs/api/agent-ingestion.md` ; changement incompatible = nouvelle version de schéma.
- Toute évolution de schéma : **nouvelle** migration (jamais de modification d'une migration
  mergée), non destructive ou avec stratégie de transition documentée.

## Conventions de code

- TypeScript strict ; pas de `any` ni de cast non justifié (commentaire obligatoire).
- Nommage métier explicite (`IngestAgentBatch`, `FindDuplicateCandidates`), jamais de
  `UtilsService`/`Helper` génériques.
- Pas de logique métier dans les Route Handlers, composants React, repositories ou migrations.
- Les refus métier sont des résultats typés ; les exceptions sont réservées aux erreurs techniques.
- Pas de singleton mutable dans le domaine ; effets de bord confinés aux adaptateurs.
- Commentaires pour le « pourquoi », pas pour paraphraser le code.
- Jamais de secret dans le code, les logs, les fixtures ou `seed.sql`.
- Imports triés automatiquement (`pnpm lint:code --fix`), formatage Prettier.

## Definition of Done

Une PR est terminée lorsque :

- [ ] le comportement est couvert par des tests : nominal **et** erreurs métier importantes pour
      chaque use case ; value objects et calculateurs testés sur des exemples connus ;
- [ ] `pnpm format:check`, `pnpm lint` (dont frontières architecturales), `pnpm typecheck`,
      `pnpm test:unit`, `pnpm test:integration` et `pnpm build` passent (CI verte) ;
- [ ] la migration éventuelle s'applique sur une base vierge (tests d'intégration) ;
- [ ] les nouvelles variables d'environnement sont validées au démarrage et documentées dans
      `.env.example` et le README ;
- [ ] aucun secret n'apparaît dans le code, les logs ou les réponses d'erreur ;
- [ ] la documentation (README, `docs/`, ADR) reflète le changement ;
- [ ] la couverture du domaine et de l'application reste ≥ 80 % (`pnpm vitest run --coverage`
      dans le package concerné).
