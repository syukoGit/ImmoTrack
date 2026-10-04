# ADR-006 — Snapshots immuables des annonces et hypothèses versionnées

- Statut : accepté
- Date : 2026-10-03

## Contexte

L'utilisateur doit voir l'historique d'une annonce (baisse de prix, changement de surface,
republication) et comprendre pourquoi une évaluation a changé. Une mise à jour en place
effacerait cette information.

## Décision

- `listing_snapshots` est **append-only** : un snapshot est créé seulement si le contenu
  normalisé diffère du précédent (`listSignificantChanges` côté domaine, `payload_hash` côté
  base). Aucune mise à jour ni suppression applicative.
- Les corrections de l'utilisateur ne réécrivent pas l'observé : elles créent une **nouvelle
  version** d'hypothèses (`evaluation_inputs`, `UNIQUE (listing_id, version)`), qualifiée par
  `source_kind` (`OBSERVED`, `ESTIMATED`, `MANUAL`).
- Une évaluation référence exactement une version d'hypothèses et une version de calculateur.
- `listings` porte une projection courante (prix, surface, statut) pour le filtrage, recalculable
  depuis les snapshots.

## Conséquences

- Historique complet et calculs reproductibles ; audit facilité.
- Volume de stockage croissant mais faible au volume V1 (JSONB compact, hash pour éviter les
  doublons).
- L'immuabilité est garantie par le code applicatif ; un garde-fou en base (révocation des
  droits `UPDATE`/`DELETE` pour un rôle applicatif dédié) pourra être ajouté sans changer le
  modèle.
