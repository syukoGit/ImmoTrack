# ImmoTrack V1

## Spécification fonctionnelle

Périmètre métier et expérience utilisateur de la V1

Version 1.0 — 3 octobre 2026

| Champ | Valeur |
| --- | --- |
| Objectif | Centraliser, historiser, évaluer et déboguer les recherches de biens immobiliers réalisées par des agents IA. |
| Utilisateur V1 | Un utilisateur administrateur unique. |
| Zone prioritaire | Tours et métropole, avec extension aux villes françaises présentant une demande locative démontrée. |
| Principe | L’IA collecte les faits ; l’application valide, déduplique, calcule, historise et présente. |

## 1. Contexte et objectifs

La tâche récurrente actuelle de recherche immobilière ne fournit pas suffisamment de persistance, de traçabilité ni de capacité de diagnostic. La V1 doit transformer la recherche en un système reproductible : chaque exécution est identifiée, chaque source consultée est suivie, chaque annonce est historisée et chaque calcul financier est explicable.

- Réduire le temps consacré au tri manuel des annonces.
- Éviter de retraiter les mêmes biens et détecter les republications ou changements de prix.
- Produire des indicateurs de rentabilité cohérents et reproductibles.
- Permettre de comprendre précisément pourquoi une exécution a réussi, échoué ou produit peu de résultats.
- Conserver une architecture compatible avec plusieurs agents et plusieurs sources à terme.

## 2. Périmètre V1

### 2.1 Inclus

- Référentiel de critères de recherche immobilière.
- Exécutions de recherche (runs) et suivi par source.
- Ingestion structurée de résultats produits par ChatGPT Work / agents IA.
- Validation du schéma d’entrée et rejet explicite des données invalides.
- Déduplication des annonces et rapprochement d’un même bien publié sur plusieurs sources.
- Historisation des changements significatifs : prix, loyer annoncé, description, surface, statut, URL.
- Calculs de rendement, financement et cash-flow à partir d’hypothèses configurées.
- Scoring explicable et règles de rejet/alerte configurables.
- Dashboard des biens, fiche détaillée, historique, recherches et erreurs.
- Workflow manuel de qualification : nouveau, à analyser, présélectionné, écarté, contacté, archivé.
- Authentification administrateur et journalisation des actions importantes.

### 2.2 Hors périmètre V1

- Scraping exécuté par l’application elle-même.
- Paiement ou consommation directe d’une API LLM depuis le backend.
- CRM complet de suivi des agents immobiliers/vendeurs.
- Signature électronique, offre d’achat ou automatisation bancaire.
- Comptabilité SCI, fiscalité exhaustive ou simulation notariale juridiquement opposable.
- Application mobile native.
- Multi-tenant / comptes multiples avec rôles complexes.

## 3. Acteurs et responsabilités

| Acteur | Responsabilité |
| --- | --- |
| Administrateur | Configure les critères, consulte et qualifie les biens, corrige les données, inspecte les runs et erreurs. |
| Agent IA | Recherche sur les sources autorisées et transmet des faits structurés sans effectuer les calculs métier définitifs. |
| Application | Valide, normalise, déduplique, historise, calcule, score et expose les données. |
| Source immobilière | Portail, agence, réseau ou plateforme d’enchères depuis laquelle une annonce est observée. |

## 4. Parcours fonctionnels principaux

### 4.1 Recherche quotidienne

1. Une exécution est créée avec un identifiant unique, une date et un jeu de critères.
2. L’agent consulte les sources prévues et collecte les annonces candidates.
3. Pour chaque source, l’agent fournit un résultat structuré avec statut, métriques et éventuelles erreurs.
4. Les données sont soumises à l’interface d’ingestion.
5. L’application valide les données, normalise les champs puis cherche les doublons.
6. Les nouvelles annonces sont créées ; les annonces connues génèrent éventuellement un nouveau snapshot.
7. Les évaluations financières sont recalculées à partir des hypothèses applicables.
8. Le run est clôturé avec les compteurs et un statut global : succès, succès partiel ou échec.

### 4.2 Analyse d’un bien

1. L’utilisateur ouvre la fiche du bien.
2. Il consulte les caractéristiques, les annonces sources et l’historique des changements.
3. Il complète ou corrige les données non fiables : charges, taxe foncière, travaux, loyer cible, vacance, financement.
4. L’application recalcule immédiatement les indicateurs.
5. L’utilisateur renseigne une décision et éventuellement une note libre.

### 4.3 Diagnostic d’une exécution

1. L’utilisateur ouvre la liste des runs.
2. Il filtre sur les runs en erreur ou succès partiel.
3. Il ouvre le détail et visualise le statut de chaque source, le nombre d’éléments vus/créés/mis à jour/rejetés et les erreurs.
4. Il consulte le payload rejeté ou un résumé de l’erreur, sans exposer les secrets.
5. Il peut marquer l’incident comme analysé et relancer ultérieurement uniquement la source concernée côté agent.

## 5. Données fonctionnelles d’un bien

| Catégorie | Champs principaux |
| --- | --- |
| Identification | ID interne, source, URL canonique, référence source, date de première/dernière observation. |
| Localisation | Adresse si disponible, ville, code postal, quartier, coordonnées si disponibles. |
| Caractéristiques | Type, surface, pièces, chambres, étage, ascenseur, DPE, copropriété, état/travaux. |
| Prix | Prix affiché, honoraires, frais estimés, historique de prix. |
| Location | Loyer annoncé/estimé, charges récupérables, vacance, type de location. |
| Charges | Taxe foncière, copropriété, assurance, entretien, gestion, autres charges non récupérables. |
| Financement | Apport, taux, durée, assurance, frais de dossier, montant financé. |
| Évaluation | Rendements, cash-flow, mensualité, effort d’épargne, score, alertes, motifs. |
| Qualification | Statut, note utilisateur, raison de rejet, date de décision. |

## 6. Règles métier V1

- Tours et sa métropole sont prioritaires, sans exclure d’autres villes françaises si la demande locative est démontrée.
- Un agent ne fournit jamais une valeur calculée considérée comme vérité métier ; les calculs de référence sont effectués côté application.
- Une annonce déjà connue ne doit pas créer un nouveau bien lorsque le rapprochement atteint un niveau de confiance suffisant.
- Toute modification substantielle d’une annonce crée un snapshot afin de préserver l’historique.
- Un calcul doit conserver ses hypothèses d’entrée afin d’être reproductible ultérieurement.
- Un score doit être explicable par une liste de critères et contributions ; aucun score opaque provenant d’un LLM ne doit décider seul.
- Une donnée estimée doit être distinguée d’une donnée observée dans l’annonce ou saisie manuellement.
- Une erreur d’une source ne doit pas invalider les résultats déjà obtenus sur les autres sources.

## 7. Indicateurs financiers minimums

| Indicateur | Définition fonctionnelle |
| --- | --- |
| Rendement brut | Loyers annuels / coût d’acquisition de référence. |
| Rendement net avant fiscalité | (Loyers - charges non récupérables - vacance) / coût d’acquisition. |
| Mensualité | Échéance du financement selon capital, taux, durée et assurance. |
| Cash-flow mensuel | Encaissements mensuels - charges mensuelles - mensualité de financement. |
| Effort d’épargne | Montant mensuel à apporter lorsque le cash-flow est négatif. |
| Prix au m² | Prix du bien / surface habitable. |
| Marge de sécurité | Écart entre scénario central et scénario dégradé paramétré. |

## 8. Écrans V1

| Écran | Fonctions |
| --- | --- |
| Dashboard | Résumé des nouveaux biens, meilleures opportunités selon filtres, alertes et état de la dernière recherche. |
| Biens | Table filtrable/triable : ville, prix, rendement, cash-flow, score, statut, date. |
| Fiche bien | Données, sources, snapshots, calculs, hypothèses, notes et workflow. |
| Runs | Historique des exécutions, statut, durée, sources, compteurs, erreurs. |
| Détail run | Chronologie, événements, erreurs, payloads rejetés, corrélation par source. |
| Critères | Configuration des zones, seuils, hypothèses par défaut et règles de scoring. |
| Ingestion agent | Page technique minimaliste pour déposer un résultat structuré et obtenir un accusé de réception. |

## 9. Critères d’acceptation V1

- Deux soumissions successives de la même annonce ne créent pas deux biens distincts.
- Une baisse de prix sur une annonce existante est visible dans son historique.
- Tout calcul affiché peut être reproduit à partir des hypothèses enregistrées.
- Un run partiellement échoué conserve les résultats valides des autres sources.
- Toute erreur d’ingestion reçoit un code lisible et une corrélation permettant de retrouver le log.
- Aucun secret technique n’apparaît dans l’UI ou les logs.
- Les données peuvent être exportées au minimum en CSV/JSON depuis l’interface administrative ou la base.
