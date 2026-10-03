# ADR-004 — Ingestion agent via un contrat JSON versionné et idempotent

- Statut : accepté
- Date : 2026-10-03

## Contexte

Les agents IA (ChatGPT Work au départ) produisent des données imparfaites, peuvent rejouer un
envoi après un timeout et voir leur prompt évoluer. L'application doit rester la source de
vérité, sans jamais laisser un payload externe atteindre le domaine tel quel.

## Décision

- Contrat **versionné** (`schemaVersion: "1.0"`) défini en Zod dans `@immotrack/contracts`,
  publié en JSON Schema (`docs/api/agent-ingestion.v1.schema.json`, généré et vérifié en CI).
- Validation **stricte à la frontière** : champs inconnus refusés, tailles bornées (500
  annonces, 100 erreurs, corps ≤ 1 Mo configurable). Une version inconnue renvoie
  `409 UNSUPPORTED_SCHEMA_VERSION`, distincte d'un payload invalide (`400`).
- Le DTO est converti en **commande applicative** ; chaque annonce est ensuite validée par les
  value objects du domaine. Une annonce invalide est rejetée seule ; le reste du lot est accepté.
- **Idempotence** obligatoire : `idempotencyKey` + empreinte SHA-256 du contenu canonique.
  Même clé et même contenu → réponse initiale (`duplicate`) ; même clé et contenu différent →
  `409 IDEMPOTENCY_KEY_CONFLICT`. Garantie en base par `UNIQUE` + `ON CONFLICT DO NOTHING`.
- L'agent transmet des **faits**, jamais de valeurs calculées.
- Authentification par **jeton porteur dédié**, dont seul le hash SHA-256 est connu du serveur,
  rotation par empreintes multiples, derrière le port `AgentAuthenticator`.

## Conséquences

- Les retries réseau sont sûrs ; un lot n'est jamais écrit deux fois.
- Toute évolution incompatible du contrat implique une version `2.0` servie en parallèle.
- Passer à OAuth, MCP ou une API machine-to-machine = nouvel adaptateur entrant et/ou nouvelle
  implémentation d'`AgentAuthenticator`, use cases inchangés.
- Reste à ajouter : rate limiting et révocation par jeton nommé (au-delà de la rotation).
