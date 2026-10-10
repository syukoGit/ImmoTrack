# ImmoTrack V1 — Décisions de cadrage et reprise

Dernière mise à jour : 10 octobre 2026.

## Statut et mode de travail

Ce document consigne les réponses validées pendant le cadrage, questions 1 à 100. Il complète les trois spécifications initiales et prévaut sur elles en cas de divergence explicitement tranchée ci-dessous. Il ne constitue pas encore la spécification finale consolidée ni une architecture validée.

L’utilisateur approuve le socle décrit dans le README. Son objectif est une **spécification finale V1 étoffée accompagnée d’un plan d’architecture clair et concis**. Le travail se fait **une question à la fois**, avec des options et une recommandation motivée. Ne pas redemander les décisions déjà prises. Ne pas réduire silencieusement le périmètre retenu, même lorsqu’il dépasse la recommandation initiale.

Le passage à l’architecture a été **explicitement annoncé après la réponse à la question 100**. La question 101 a été posée mais **n’a pas reçu de réponse**. L’utilisateur a demandé de sauvegarder le travail pour faire lui-même un commit et reprendre plus tard. Aucun commit n’a été demandé à l’assistant.

## Décisions validées — questions 1 à 100

Les lettres sont les réponses choisies. Les précisions ci-dessous reprennent leur sens et les clarifications actées dans la conversation.

### Collecte, recherches et données communes

| N° | Choix | Décision |
| --- | --- | --- |
| 1 | A | L’agent recherche les annonces et dépose directement les résultats dans ImmoTrack, sans intervention manuelle. |
| 2 | C | Recherches quotidiennes automatiques et lancement supplémentaire à la demande. La programmation est précisée en Q69. |
| 3 | B | Plusieurs recherches indépendantes, chacune avec ses critères et son activation automatique. |
| 4 | C | Chaque recherche distingue critères éliminatoires et préférences. |
| 5 | A | Une information nécessaire à un critère éliminatoire mais absente ne provoque pas l’exclusion : conserver avec « à vérifier », sans considérer le bien conforme. |
| 6 | A | Une fiche commune par bien, avec notes partagées et une évaluation distincte pour chaque recherche. Le suivi initialement commun est affiné en Q15 et Q83 : qualification par recherche et exclusion globale possible. |
| 7 | A | Les rapprochements incertains restent séparés et sont proposés à l’utilisateur pour confirmation. |
| 8 | A | Une correction manuelle reste prioritaire sur les nouvelles observations ; conserver les valeurs collectées et signaler les divergences. |
| 9 | A | Une seule simulation par bien et par recherche. Des scénarios central et dégradé appartiennent à cette simulation ; pas de multiplication de variantes indépendantes dans une même recherche. |
| 10 | A | Hypothèses par défaut de la recherche, ajustables pour chaque bien dans cette recherche. |
| 11 | A | Modifier les hypothèses de la recherche recalcule automatiquement les simulations, préserve les ajustements par bien et conserve l’historique. |
| 12 | A | Score explicable avec priorités ajustables par recherche, en complément des tris et filtres. |
| 13 | A | Séparer score d’opportunité et complétude des données. Score « non calculable » si les données essentielles manquent. |
| 14 | A | Un bien devenu non conforme reste rattaché à la recherche avec le motif, les notes et le suivi, mais sort du classement conforme. |
| 15 | C | Au moment d’écarter un bien, choisir cette recherche uniquement ou toutes les recherches. |
| 16 | A | Une baisse de prix rendant un bien écarté intéressant peut produire une alerte de réexamen ; ne pas annuler automatiquement la décision. |
| 17 | A | Alertes dans l’application uniquement, avec récapitulatif sur le dashboard. Pas d’e-mail en V1. |
| 18 | A | Signaler une annonce retirée comme indisponible. Lorsque toutes les annonces du bien sont indisponibles, le retirer des opportunités actives en conservant historique et suivi. Une erreur technique de source ne suffit pas à déclarer une annonce indisponible. |
| 19 | B | Catalogue commun de sources disponibles, avec sélection par recherche. |
| 20 | A | Une tentative supplémentaire automatique pour les erreurs temporaires de source, puis alerte et relance possible de la seule source concernée. Conserver les résultats valides ; ne pas insister lorsqu’une intervention humaine est nécessaire. |

### Finance, immeubles et lots

| N° | Choix | Décision |
| --- | --- | --- |
| 21 | A | Analyse financière avant fiscalité uniquement, scénarios central et dégradé. |
| 22 | A | L’agent estime le loyer à partir de références locales documentées, avec sources et justification. Sans documentation suffisante, le loyer reste inconnu ; pas de barème automatique de remplacement. Correction manuelle prioritaire. |
| 23 | A | Scénario dégradé défini par écarts configurables par recherche et ajustables par bien : loyer, vacance, charges, travaux. |
| 24 | C | Financement avec apport fixé et emprunt calculé, ou emprunt fixé et apport calculé ; achat comptant disponible. Détailler achat, frais d’acquisition, travaux, mobilier et frais de financement. |
| 25 | A | Charges, taxe foncière ou travaux inconnus : hypothèses configurables, clairement estimées, simulation provisoire. Ne jamais assimiler inconnu à zéro. Cette règle ne remplace pas les exigences documentaires sur les revenus de Q22 et Q44. |
| 26 | A | Ventes classiques uniquement ; pas d’enchères ni de viagers en V1. |
| 27 | B | Appartements, maisons et immeubles de rapport. |
| 28 | B | Immeubles détaillés par lot : usage, surface, occupation, loyer, charges ; synthèse financière globale et données manquantes signalées. |
| 29 | B | Lots d’habitation, commerces, bureaux, parkings et garages. Évaluation avant fiscalité ; pas d’analyse juridique des baux. |
| 30 | A | Lot loué : utiliser le loyer réellement pratiqué. Lot vacant : utiliser le loyer estimé. Afficher séparément le potentiel locatif. |
| 31 | A | Un revenu locatif global déclaré pour l’immeuble permet une simulation provisoire sans inventer sa répartition ; compléter ensuite par lot sans double comptage. |
| 32 | B | Deux vues : première année avec travaux/mise en location, puis année stabilisée. |
| 33 | B | Calendrier de travaux et délai avant perception des loyers par lot, avec valeurs communes par défaut. |
| 34 | A | Trésorerie mensuelle : loyers, charges, travaux, crédit et besoin maximal de trésorerie. Horizon affiné en Q92–93. |
| 35 | B | Remboursement dès acquisition par défaut ; différé de capital configurable, intérêts et assurance payés pendant le différé. |
| 36 | B | Dépenses de travaux réparties automatiquement sur leur durée, ajustables mois par mois, par lot et pour les parties communes. |
| 37 | A | Séparer charges par lot et charges communes ; distinguer récupérable et non récupérable, sans double comptage. |
| 38 | B | Mode de location par défaut dans la recherche, ajustable par lot ; commerces, bureaux et stationnements gardent leur usage. Une simulation globale par projet et recherche. Voir la séparation saisonnier/longue durée ci-dessous. |
| 39 | A | Colocation : loyer total et vacance au niveau du logement, sans modélisation par chambre. |

### Location saisonnière et séparation des stratégies

**Clarification explicite de l’utilisateur après Q42 : la location saisonnière est un type de recherche spécifique ; pas de comparaison avec les biens d’une recherche longue durée.** Les immeubles mixtes sont néanmoins acceptés dans une recherche saisonnière selon Q89–91.

| N° | Choix | Décision |
| --- | --- | --- |
| 40 | B | Inclure longue durée (nu, meublé, colocation) et saisonnier, dans des types de recherche distincts. |
| 41 | B | Prix par nuit et occupation paramétrables par mois ; valeurs annuelles par défaut pour simplifier la saisie. |
| 42 | B | Frais saisonniers détaillés : plateformes, conciergerie, ménage/linge par séjour, consommables et charges fixes. Durée moyenne de séjour pour estimer leur nombre. Distinguer frais facturés au voyageur et dépenses supportées. |
| 43 | A | Faisabilité saisonnière non vérifiée : conserver avec alerte, simulation provisoire, sans conformité acquise. |
| 44 | A | Estimations mensuelles de prix par nuit et d’occupation documentées par l’agent à partir de références locales. Sans données suffisantes, indicateurs concernés non calculables ; correction manuelle possible. |
| 45 | A | Dashboard : synthèse globale d’activité et d’alertes, classements distincts par recherche ; aucun classement mêlant saisonnier et longue durée. |
| 46 | A | Comparaison côte à côte des biens d’une même recherche : caractéristiques, coût total, rendements, trésorerie, score, données manquantes. Respecter les séparations de stratégies. |

### Exécutions et qualité des données

| N° | Choix | Décision |
| --- | --- | --- |
| 47 | C | Recherche de nouvelles annonces selon programmation ; fréquence d’actualisation des biens connus configurable selon leur statut. |
| 48 | B | Aucun plafond fonctionnel d’annonces collectées. L’agent tente de parcourir tous les résultats pertinents ; signaler l’incomplétude si une limite technique interrompt la collecte. Ne promet pas l’exhaustivité d’une source inaccessible. |
| 49 | A | Reprise automatique au dernier point connu lorsque possible, sans dupliquer les résultats, avec nombre limité de tentatives. Distinguer cette reprise de collecte du retry d’erreur temporaire de Q20 ; limites exactes à spécifier. |
| 50 | A | Une exécution à la fois par recherche. Une nouvelle demande renvoie vers l’exécution en cours, sans mise en attente ni remplacement. Recherches différentes indépendantes. |
| 51 | A | Les critères sont figés au démarrage de l’exécution ; les modifications s’appliquent à l’exécution suivante. |
| 52 | A | Dans un lot valide, enregistrer les annonces valides et rejeter individuellement les invalides avec motif ; correction et renvoi possibles. Le cas d’une enveloppe entière invalide reste à formaliser. |
| 53 | A | Prix ou surface absents acceptables si l’annonce est identifiable par une source exploitable et pertinente ; calculs dépendants indisponibles. Distinguer absence et valeur invalide. |
| 54 | A | Sans correction manuelle, utiliser la valeur observée le plus récemment lorsque les sources divergent ; conserver provenance et signalement du désaccord. |
| 55 | A | Annuler un rapprochement erroné depuis l’application, conserver l’historique et choisir le rattachement des notes/corrections. |
| 56 | A | Catalogue de critères prédéfinis avec seuils, caractère éliminatoire et poids configurables ; pas d’éditeur de formules ou de critères libres en V1. |
| 57 | B | Zones par communes, codes postaux ou rayon autour d’un lieu ; exclusions possibles ; localisation insuffisante signalée. |
| 58 | B | Demande locative documentée par l’agent avec sources, date et justification ; seuil minimal possible ; insuffisamment documentée = « à vérifier ». |
| 59 | A | Demande touristique évaluée séparément : fréquentation, saisonnalité, références locales et seuil minimal configurable. |

### Saisie manuelle, documents et commandes agent

| N° | Choix | Décision |
| --- | --- | --- |
| 60 | B | Ajouter un bien via URL et collecte agent, ou créer manuellement une fiche sans lien ; rattachement à une recherche. |
| 61 | A | Fiche sans lien actualisée manuellement ; rattacher une annonce permet son suivi automatique. |
| 62 | A + précision | Pièces jointes consultables/téléchargeables : diagnostics, taxe foncière, devis, copropriété et plans. L’agent récupère automatiquement les plans accessibles depuis les annonces consultées, avec provenance. |
| 63 | A | Conserver une copie des photos avec provenance, consultable après disparition de l’annonce. |
| 64 | B | Analyse des plans par l’agent : suggestions de disposition, pièces, surfaces ; distinguer mesures inscrites et interprétations. Validation utilisateur avant usage dans les données/calculs. |
| 65 | A | Même extraction assistée pour les autres documents, avec document/page source et validation manuelle avant application. |
| 66 | B | Analyse documentaire uniquement à la demande depuis la fiche, pas automatiquement à l’ajout. |
| 67 | A | Recherche à la demande, collecte d’URL et analyse documentaire déclenchées depuis ImmoTrack, avec suivi de progression et résultats dans l’application. Faisabilité des intégrations à vérifier pendant l’architecture. |
| 68 | A | Demander l’arrêt d’une action depuis l’application ; conserver les résultats enregistrés et statut « interrompu par l’utilisateur ». |
| 69 | B | Jours et heure configurables par recherche, fuseau Europe/Paris ; programmation quotidienne par défaut. |
| 70 | A | Après indisponibilité, une seule exécution de rattrapage même si plusieurs créneaux manqués. |
| 71 | A | Pause ou archivage d’une recherche : arrêt de collecte, critères/résultats/historiques conservés ; pas de suppression définitive en V1. |

### Références financières et règles complémentaires

| N° | Choix | Décision |
| --- | --- | --- |
| 72 | A | Seuils financiers et classement fondés sur année stabilisée, scénario central. Première année et dégradé sont indicateurs de risque, pas une référence de classement configurable. |
| 73 | A | Deux plafonds facultatifs indépendants : prix d’achat et coût total (frais, travaux, mobilier inclus). |
| 74 | A | Prix affiché par défaut ; prix négocié envisagé saisissable pour la simulation, signalé comme hypothèse et distinct de l’historique des prix annoncés. |
| 75 | B | Rendements affichés sur prix d’achat et sur coût total ; coût total comme référence de classement. |
| 76 | B | Vacance longue durée en semaines sans loyer par an, par recherche et ajustable par lot ; délai initial de mise en location traité séparément. |
| 77 | A | Perte de loyers de vacance lissée sur les mois où le lot est disponible, sans calendrier manuel de semaines vacantes. |
| 78 | A | Impayés distincts de la vacance : taux de perte sur loyers attendus, nul par défaut, configurable par recherche et lot. |
| 79 | B | Assurance emprunteur calculée au choix sur capital initial ou capital restant dû. |
| 80 | A | Frais d’acquisition : pourcentage configurable du prix, remplaçable par montant exact ; honoraires d’agence distingués pour éviter double comptage. |
| 81 | A | Chaque lot concerné doit respecter les critères éliminatoires : un lot non conforme rend le projet non conforme ; une donnée manquante entraîne « à vérifier ». Détail des motifs par lot. |
| 82 | A | Biens « à vérifier » dans une section distincte des opportunités conformes, avec vérifications nécessaires. |
| 83 | B | Qualification (« présélectionné », « contacté », etc.) propre à chaque recherche ; notes et contacts communs au bien. Affine Q6 ; exclusion globale de Q15 maintenue. |
| 84 | A | Contacts : coordonnées, date du dernier contact, notes libres ; pas d’historique CRM structuré, visites/actions/échéances en V1. |
| 85 | A | Résultats visibles progressivement après validation, avec indication de recherche en cours. |
| 86 | B | Export CSV des résultats et export JSON détaillé des hypothèses, évaluations et historiques depuis l’interface. |
| 87 | B | Toutes les fonctionnalités sur ordinateur et mobile, y compris simulations et comparaisons ; présentation adaptée. |
| 88 | A | Biens, historiques et pièces jointes sans expiration automatique en V1, y compris archivés/indisponibles. Ne définit pas encore la rétention des logs techniques/payloads. |
| 89 | B | Recherche saisonnière autorisant un immeuble mixte avec commerce ou logements restant en longue durée ; revenus séparés par usage, évaluation globale dans la recherche saisonnière. |
| 90 | A | Critères touristiques/faisabilité saisonnière appliqués uniquement aux lots saisonniers ; autres lots évalués selon leur usage. |
| 91 | B | Dans une recherche saisonnière, classements séparés des biens entièrement saisonniers et immeubles mixtes. |
| 92 | B | Projection mensuelle au moins sur 12 mois, prolongée jusqu’à fin des travaux et mise en location prévue de tous les lots. |
| 93 | A | Limite de projection mensuelle : 36 mois ; alerte si calendrier plus long. |
| 94 | A | Tout le crédit est supposé débloqué dès acquisition, y compris financement des travaux ; pas de déblocage progressif en V1. |
| 95 | A | Durée du crédit incluant le différé : 20 ans dont 1 an de différé = 19 ans d’amortissement. Afficher les périodes séparément. |
| 96 | A | Réserve de trésorerie saisie séparément de l’apport, comparée au besoin maximal avec alerte de manque. |
| 97 | A | Profils de scoring proposés par type de recherche, poids modifiables, contributions expliquées. Formules et poids initiaux restent à définir. |
| 98 | A | Dérogation manuelle à un critère éliminatoire pour une recherche, motif obligatoire, badge « exception manuelle », non-conformité initiale conservée. |
| 99 | A | Si la donnée concernée change, exception à confirmer de nouveau ; retrait du classement conforme entre-temps. |
| 100 | C | ChatGPT Work prioritaire ; agent par API possible si les automatisations l’exigent. Assouplit l’interdiction initiale de consommation d’API LLM. Les calculs métier restent déterministes dans ImmoTrack. |

## Point de reprise exact

**Reprendre à la question 101, sans considérer la recommandation comme acceptée.** Le passage à l’architecture a déjà été annoncé ; un bref rappel suffit.

> Question 101 — Souhaites-tu conserver la stack proposée dans les documents actuels ?
>
> - **A.** Oui : TypeScript, Next.js sur Vercel, PostgreSQL et authentification via Supabase. Les traitements longs des agents auront un composant d’exécution adapté.
> - **B.** Réexaminer aussi cette stack avant de la retenir.
>
> Recommandation présentée : **A**, pour conserver le socle validé et concentrer les décisions sur l’orchestration des agents et la fiabilité des traitements.

**Réponse en attente.** Aucun hébergeur de worker, système de queue, fournisseur/modèle API ni mécanisme de déclenchement ChatGPT Work n’a été choisi ou vérifié. Ne pas présenter le déclenchement direct de ChatGPT Work depuis ImmoTrack comme une capacité acquise.

## Travail restant pour aboutir à la spec finale

Ces éléments sont des sujets de travail, **pas de nouvelles décisions approuvées**.

1. Valider ou réexaminer la stack via Q101, puis poursuivre l’entretien une question à la fois.
2. Vérifier les possibilités réelles de ChatGPT Work et des agents API : commandes depuis ImmoTrack, exécution planifiée sans intervention, navigation/collecte, accès aux documents, suivi, annulation et remontée des résultats. Définir les limites et le recours à l’API sans promettre un basculement transparent non vérifié.
3. Définir l’orchestration des tâches longues : planification Europe/Paris et changements d’heure, file durable, worker, progression, reprise, annulation, verrouillage par recherche, rattrapage et limites de concurrence/coût. Distinguer autonomie des recherches et absence de concurrence sur une même recherche.
4. Adapter le modèle métier : bien, annonce, observation/snapshot, lot, recherche versionnée, rattachement bien–recherche, qualification, simulation/scénarios, corrections, dérogations, pièces jointes, suggestions documentaires et opérations agent. Distinguer faits partagés et hypothèses propres à une recherche.
5. Formaliser les contrats et transactions : enveloppe invalide versus annonce rejetée, lots partiels, statuts/transitions, idempotence (clé, durée, contenu différent, concurrence), reprise après crash et compteurs fiables.
6. Spécifier précisément rapprochement/défusion, provenance et ordre des valeurs, seuils de confiance, égalité des dates, critères de retrait d’annonce et actualisation d’un même bien suivi dans plusieurs recherches.
7. Définir formules financières, unités, assiettes, arrondis, hypothèses par défaut, scoring et preuves minimales des estimations/demandes locales. Résoudre notamment l’articulation revenu global/détail par lot, année stabilisée, différé et mensualité, réserve versus capital travaux, frais récupérables et saisonnalité. Préparer exemples chiffrés vérifiables (achat comptant, taux nul, données manquantes, immeuble mixte, démarrage long).
8. Définir autorisations administrateur/agents, secrets, stockage privé des médias/documents, sauvegardes et restauration, rétention technique, quotas d’infrastructure et observabilité. La conservation métier sans expiration ne signifie pas stockage techniquement illimité.
9. Consolider les trois spécifications existantes et leur cohérence avec toutes les décisions ci-dessus. Produire un plan d’architecture clair et concis, les contrats nécessaires et un ordre de réalisation testable. Ne pas présenter ce journal seul comme la spec finale terminée.

## Fichiers de référence

- [README et points ouverts initiaux](README.md)
- [Spécification fonctionnelle initiale](01_Specification_fonctionnelle_ImmoTrack_V1.md)
- [Spécification technique initiale](02_Specification_technique_ImmoTrack_V1.md)
- [Spécification d’architecture initiale](03_Specification_architecture_ImmoTrack_V1.md)

Les documents initiaux sont conservés comme base ; ils n’ont pas encore été réécrits pour intégrer l’entretien. Lire ce journal avant de s’appuyer sur leurs restrictions ou leur modèle de données.
