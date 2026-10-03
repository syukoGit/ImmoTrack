# ADR-005 — Calculs financiers déterministes, hors LLM

- Statut : accepté
- Date : 2026-10-03

## Contexte

Rendements, mensualités, cash-flow et scores orientent des décisions d'investissement : ils
doivent être exacts, reproductibles et explicables. Un LLM n'offre aucune de ces garanties.

## Décision

- Les calculateurs sont des **fonctions pures** dans `domain/evaluation` : pas de base, pas
  d'horloge, pas de réseau, pas de hasard.
- Montants en **centimes entiers** (`Money`) ; un montant d'entrée de plus de deux décimales est
  rejeté plutôt qu'arrondi silencieusement ; les multiplications arrondissent au centime « demi
  éloigné de zéro ». Les pourcentages (`Percentage`) sont arrondis explicitement à 4 décimales.
- Chaque évaluation stocke `calculator_version` (`CALCULATOR_VERSION`) et l'identifiant de la
  version d'hypothèses utilisée ; toute modification d'un calculateur incrémente la version.
- Le score est une somme de contributions par critère (`score_breakdown`), jamais une valeur
  opaque fournie par un LLM.
- Tests de non-régression sur jeux d'exemples connus (`it.each` avec valeurs attendues).

## Conséquences

- Tout chiffre affiché peut être recalculé à l'identique à partir des données persistées.
- Les données estimées sont distinguées des données observées ou saisies (`source_kind`).
- Le moteur peut évoluer sans réécrire l'historique : les anciennes évaluations gardent leur
  version de calculateur.
