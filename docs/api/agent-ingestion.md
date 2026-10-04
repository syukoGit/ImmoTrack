# API — Ingestion agent v1.0

`POST /api/v1/agent-ingestion` reçoit un lot d'annonces observées par un agent IA sur **une**
source, pour **un** run. L'agent transmet des faits ; il ne transmet jamais de valeur calculée
(rendement, score…) : les calculs de référence sont faits par ImmoTrack.

- Schéma JSON publié : [`agent-ingestion.v1.schema.json`](agent-ingestion.v1.schema.json)
  (généré depuis le schéma Zod de `@immotrack/contracts`, vérifié en CI).
- Exemple valide : [`examples/agent-ingestion.v1.json`](examples/agent-ingestion.v1.json).
- Décision : [ADR-004](../adr/ADR-004-agent-ingestion-contract.md).

## Requête

```http
POST /api/v1/agent-ingestion
Authorization: Bearer <jeton agent>
Content-Type: application/json
X-Correlation-Id: <optionnel, 8 à 128 caractères [A-Za-z0-9._:-]>
```

```json
{
  "schemaVersion": "1.0",
  "idempotencyKey": "2026-10-03:leboncoin:batch-001",
  "runId": "0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90",
  "source": { "code": "leboncoin", "status": "SUCCESS" },
  "observedAt": "2026-10-03T06:12:00+02:00",
  "listings": [
    {
      "sourceReference": "abc123",
      "url": "https://www.leboncoin.fr/ad/ventes_immobilieres/abc123",
      "title": "Appartement T2 41 m² proche gare",
      "price": 92000,
      "surfaceM2": 41,
      "city": "Tours",
      "postalCode": "37000",
      "rawFacts": { "rooms": 2, "floor": 3, "energyClass": "D" }
    }
  ],
  "errors": []
}
```

| Champ                        | Règle                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `schemaVersion`              | `"1.0"` exactement                                                                   |
| `idempotencyKey`             | 8–200 caractères `[A-Za-z0-9._:-]` ; une clé = un contenu, pour toujours             |
| `runId`                      | UUID du run, généré par l'agent ; le run est ouvert à la première ingestion          |
| `source.code`                | slug d'une source **active** du référentiel (`sources`)                              |
| `source.status`              | `SUCCESS`, `PARTIAL_SUCCESS` ou `FAILED`                                             |
| `observedAt`                 | date ISO-8601 **avec** décalage horaire                                              |
| `listings`                   | 0 à 500 annonces                                                                     |
| `listings[].sourceReference` | identifiant de l'annonce chez la source (1–200)                                      |
| `listings[].url`             | URL http(s) (≤ 2048) ; normalisée côté serveur (https, sans tracking)                |
| `listings[].price`           | prix affiché en euros, > 0, au plus 2 décimales                                      |
| `listings[].surfaceM2`       | optionnel, > 0                                                                       |
| `listings[].postalCode`      | optionnel, code postal français                                                      |
| `listings[].rawFacts`        | optionnel, faits bruts (≤ 100 clés), conservés tels quels                            |
| `errors`                     | 0 à 100 erreurs rencontrées par l'agent sur cette source (`code`, `message`, `url?`) |

Les champs inconnus sont **refusés** (contrat strict) afin de détecter toute dérive du prompt
de l'agent.

## Réponses

Toutes les réponses portent l'en-tête `X-Correlation-Id` (celui fourni, s'il est sûr, ou un UUID
généré) et `Cache-Control: no-store`.

### 202 — lot accepté

```json
{
  "status": "accepted",
  "ingestionRequestId": "8b68779b-2813-4d91-b597-ff6977e7fb66",
  "correlationId": "manual-check-0001",
  "summary": {
    "received": 2,
    "accepted": 1,
    "rejected": 1,
    "sourceErrorsReported": 1,
    "rejectedListings": [
      {
        "index": 1,
        "sourceReference": "bad",
        "violations": [{ "code": "POSTAL_CODE_INVALID", "field": "postalCode" }]
      }
    ]
  }
}
```

Une annonce invalide au sens métier (code postal, prix, URL…) est rejetée **individuellement** :
les autres annonces du lot restent acceptées.

### 200 — lot déjà reçu (rejeu idempotent)

Même `idempotencyKey` **et** même contenu : la réponse initiale est renvoyée avec
`"status": "duplicate"` et le même `ingestionRequestId`. Aucune écriture n'est faite. Un agent
peut donc rejouer sans risque un envoi dont il n'a pas reçu la réponse.

### Erreurs

Format commun :

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Payload does not match the agent ingestion contract.",
    "correlationId": "0d04cfa0-35c3-41e7-b34a-b36f6440274d",
    "details": [{ "path": "listings.0.url", "message": "Invalid URL" }]
  }
}
```

| HTTP | `code`                       | Cause                                             | Action de l'agent              |
| ---- | ---------------------------- | ------------------------------------------------- | ------------------------------ |
| 400  | `VALIDATION_FAILED`          | JSON invalide ou contrat non respecté (`details`) | corriger le payload            |
| 401  | `UNAUTHORIZED`               | jeton absent ou invalide (aucun détail)           | vérifier le jeton              |
| 409  | `UNSUPPORTED_SCHEMA_VERSION` | `schemaVersion` inconnue                          | changer de version de contrat  |
| 409  | `IDEMPOTENCY_KEY_CONFLICT`   | clé déjà utilisée avec un **autre** contenu       | générer une nouvelle clé       |
| 413  | `PAYLOAD_TOO_LARGE`          | corps > `AGENT_INGESTION_MAX_BODY_BYTES`          | découper le lot                |
| 415  | `UNSUPPORTED_MEDIA_TYPE`     | `Content-Type` ≠ `application/json`               | corriger l'en-tête             |
| 422  | `UNKNOWN_SOURCE`             | source absente du référentiel ou inactive         | vérifier `source.code`         |
| 503  | `SERVICE_UNAVAILABLE`        | base indisponible / configuration serveur         | réessayer avec **la même** clé |
| 500  | `INTERNAL_ERROR`             | erreur inattendue (détails dans les logs serveur) | signaler le `correlationId`    |

Le `correlationId` permet de retrouver la trace complète dans les logs serveur (JSON) et dans
`agent_events.correlation_id`.

## Effets en base (tranche V1)

Dans une transaction unique :

1. `search_runs` : création du run s'il n'existe pas (`RUNNING`) ;
2. `ingestion_requests` : réservation de la clé d'idempotence (contrainte `UNIQUE`) avec
   l'empreinte SHA-256 du contenu et le résumé renvoyé ;
3. `agent_events` : `INGESTION_BATCH_ACCEPTED`, `LISTINGS_REJECTED` (si besoin),
   `SOURCE_ERROR_REPORTED` (une par erreur remontée).

Le rapprochement des annonces, les snapshots et les recalculs financiers seront branchés dans le
même use case sans changement de contrat.
