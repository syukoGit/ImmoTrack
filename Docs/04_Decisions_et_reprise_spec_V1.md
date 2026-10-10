# ImmoTrack V1 — Décisions de cadrage et reprise

Dernière mise à jour : 10 octobre 2026 — consolidation après Q152.

## Statut et mode de travail

Ce journal conserve les décisions Q1–152 et leurs révisions explicites. L'objectif reste une spécification fonctionnelle étoffée et une architecture claire, en .NET et React TypeScript. Les décisions utilisateur priment sur toute proposition de réalisation.

Le travail d'arbitrage se fait une question à la fois, avec recommandation motivée. Ne pas redemander les décisions prises, ni réduire silencieusement le périmètre. Les specs initiales du 3 octobre ont été réécrites après cet entretien. Les points de faisabilité restant à tester sont signalés ; ils ne constituent pas des fonctionnalités vérifiées.

Les tableaux Q1–100 ci-dessous sont conservés comme historique. Pour les règles actuelles, appliquer la section « Révisions qui priment sur les décisions antérieures ».

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

## Décisions validées — questions 101 à 152

Les lettres désignent les réponses effectivement retenues, y compris les choix formulés librement. Les recommandations non retenues ne sont pas des décisions.

| N° | Choix | Décision |
| --- | --- | --- |
| 101 | B + précision | Réexaminer la stack. Backend .NET, frontend React TypeScript. Révision explicite de Q100 : plusieurs environnements d'agents et modèles dès la V1, dont ChatGPT Work et agents par API, sans priorité imposée à Work. Chaque intégration reste soumise à ses capacités réelles. |
| 102 | C | Garder une architecture déployable sur services managés ou serveur privé Docker. Le premier déploiement est précisé en Q152. |
| 103 | A | PostgreSQL. |
| 104 | A + précision | Monolithe modulaire .NET, architecture hexagonale et Clean Code obligatoires. Domaine indépendant des frameworks, de la persistance et des fournisseurs IA. |
| 105 | A | Worker .NET dans un processus séparé de l'API, partageant les modules applicatifs nécessaires. |
| 106 | A | File de tâches persistante PostgreSQL, derrière une interface. |
| 107 | Choix libre | Keycloak pour l'authentification humaine ; possibilité de fédérer ultérieurement Microsoft, Google ou Auth0 via les protocoles supportés. |
| 108 | A | Compte local Keycloak avec mot de passe et double authentification au lancement ; administrateur explicitement autorisé. |
| 109 | A | BFF .NET : jetons côté serveur, cookie sécurisé HttpOnly, protection CSRF. |
| 110 | A | Stockage objet privé compatible S3 ; métadonnées et provenance dans PostgreSQL, accès derrière un port. |
| 111 | A | Agent par défaut, personnalisable par type de tâche et recherche ; seuls les agents compatibles avec la tâche sont proposés. |
| 112 | B | Relais automatique configurable par liste ordonnée d'agents autorisés ; sans configuration, relais manuel. Résultats conservés ; reprise exacte entre agents non garantie. |
| 113 | A | Budget mensuel global pour API payantes et plafond par tâche partagé entre tentatives et relais. Suspension des nouveaux traitements payants concernés et alerte à l'atteinte. Un appel engagé peut encore coûter. Montants à configurer. |
| 114 | A | Administration des intégrations, modèles, identifiants et relais dans ImmoTrack ; secrets protégés côté serveur. Un nouveau protocole peut nécessiter du code. |
| 115 | A | Actions agent encadrées : observations, estimations sourcées, propositions documentaires. Pas de modification autonome des critères, hypothèses manuelles ou qualification. |
| 116 | A | Identité technique distincte par intégration, droits limités et révocation indépendante de la session humaine. |
| 117 | A | Limites de concurrence globales et par intégration, attente de capacité ; une seule exécution active par recherche. |
| 118 | A | Priorité aux demandes manuelles en attente, sans préemption des tâches en cours et sans attente indéfinie du programmé. |
| 119 | A | Délais d'inactivité et de durée totale par intégration/type de tâche, détection des blocages, reprise/relais configurés et invalidation des anciennes tentatives. |
| 120 | B | Suivi synthétique et chronologie détaillée : tentatives, relais, sources, incidents, consommation connue. Aucun secret ni raisonnement interne des modèles. |
| 121 | C | Rétention des journaux techniques configurable, 90 jours par défaut. Pas d'expiration des données métier et de leur provenance. |
| 122 | A | Sauvegarde quotidienne chiffrée sur stockage distinct : PostgreSQL, fichiers et données/configuration Keycloak. Tests de restauration ; objectif de perte maximale de 24 h. |
| 123 | B | 30 jours de sauvegardes quotidiennes et une sauvegarde mensuelle pendant un an. |
| 124 | A | Objectif de remise en service sous 24 h, procédure documentée et testée. |
| 125 | A | Développement local et production ; pas de préproduction permanente prévue. |
| 126 | A | Déclenchement manuel du déploiement après contrôles automatisés ; exécution du déploiement automatisée. |
| 127 | A | Courte maintenance annoncée, nouveaux traitements suspendus, arrêt/reprise sûre des tâches et vérification après déploiement. |
| 128 | A | Tout bien contient un ou plusieurs lots ; maison/appartement à lot unique. Loyers, occupation et mode de location par lot ; acquisition, financement et dépenses communes au bien/projet. |
| 129 | A | Revenu global conservé tant que le détail des loyers par lot est incomplet ; ne pas additionner global et détail. Simulation provisoire. |
| 130 | B | Si le détail complet diffère du global, validation manuelle avant bascule ; global conservé entre-temps, avec signalement et simulation provisoire. |
| 131 | A | Année stabilisée théorique, tous les lots destinés à la location disponibles après travaux ; vacance, impayés et saisonnalité conservés. Projection distincte du démarrage réel. |
| 132 | A | Charge de crédit stabilisée : douze mensualités normales après différé. Assurance sur capital restant dû : douze premiers mois d'amortissement comme référence. |
| 133 | A | Crédit inchangé dans le dégradé ; dépassement de travaux couvert par fonds personnels/réserve, sans supposer un prêt supplémentaire. |
| 134 | A | Rendement net = revenu annuel net d'exploitation / coût total × 100. Déduire vacance, impayés et dépenses supportées par le propriétaire. Crédit/assurance emprunteur dans cash-flow, pas rendement ; travaux initiaux au coût total, sans double déduction. Rendement sur prix d'achat aussi affiché. |
| 135 | A | Besoin de réserve = déficit cumulé maximal après apport et crédit, avant réserve disponible. Flux : achat/frais/travaux/mobilier/charges/crédit et recettes. Comparer à la réserve saisie séparément. |
| 136 | A | Dégradé par défaut : loyers longue durée −10 %, vacance +2 semaines/an, nuitée −10 %, occupation saisonnière −10 points, dépenses d'exploitation propriétaire +10 %, travaux +15 %. Écarts cumulés, configurables et ajustables ; inconnus restent inconnus, financement inchangé. |
| 137 | A | Score fondé sur objectifs fixes de la recherche, indépendant des autres biens trouvés. |
| 138 | A | Poids initiaux : rendement net sur coût total 40 %, cash-flow mensuel stabilisé 40 %, demande locale 20 %. Poids modifiables ; demande locative/touristique selon usage. |
| 139 | A | Notes financières linéaires entre niveau bas = 0 et cible = 100, bornées à [0,100] ; repères configurables distincts des critères éliminatoires. Les exemples 3 %/8 % étaient illustratifs, pas des valeurs par défaut validées. |
| 140 | A | Demande locale sur cinq niveaux 0/25/50/75/100, justification et sources datées ; grille locative/touristique distincte. Preuves insuffisantes = inconnu. |
| 141 | C1 + recommandations | Dimension manquante imputée à 50/100 uniquement dans le score. Badge provisoire, part pondérée documentée ; pas de données financières inventées. Aucune dimension de poids non nul connue = non calculable. Critère éliminatoire inconnu = à vérifier. Remplace la restriction de Q13. |
| 142 | B | Scores complets et provisoires dans un classement commun avec badge et part documentée. Maintenir les séparations conforme/à vérifier et stratégies/saisonnier mixte. |
| 143 | A | Loyer longue durée estimé par agent : au moins trois biens comparables distincts, références de moins de six mois, sources consultables, justification des écarts. Distinguer loyers annoncés/pratiqués. À défaut, inconnu ; hypothèse manuelle possible. |
| 144 | B | Autoriser aussi l'estimation d'occupation saisonnière à partir des calendriers publics, avec incertitude, méthode et sources. Distinguer indisponibilité observée et occupation payante estimée ; simulation provisoire. |
| 145 | A | Séparer orchestrateur ImmoTrack, adaptateurs d'exécution et adaptateurs de modèles pour les agents pilotés par le worker. Déclarer capacités réelles. |
| 146 | A | Contrat commun mission/suivi/résultats/fin via API HTTP JSON versionnée. Adaptateur MCP lorsque nécessaire et supporté, mêmes cas d'usage. |
| 147 | A | Clé d'idempotence par envoi : rejeu identique sans nouveaux effets, contenu différent en conflit. Lot valide : rejets individuels. Résultats acceptés, compteurs et demandes de recalcul enregistrés atomiquement. |
| 148 | A | Recalculs multiples en arrière-plan, anciens résultats marqués obsolètes. Évaluation liée aux versions exactes ; une génération ancienne ne remplace jamais une plus récente. |
| 149 | A | Concurrence optimiste : refuser une modification basée sur une version dépassée, présenter valeur actuelle et proposition. Observations agent historisées séparément. |
| 150 | A | EF Core pour écritures/migrations, lectures dédiées optimisables en SQL ; persistance dans les adaptateurs uniquement. Même base, sans base de lecture séparée. |
| 151 | A | Plafond d'infrastructure de 20 €/mois hors API IA, incluant serveur, fichiers, sauvegardes, PostgreSQL et Keycloak. Faisabilité tarifaire/capacité à vérifier. |
| 152 | A | Premier déploiement sur un serveur privé Docker : API, frontend, worker, PostgreSQL, Keycloak distincts ; sauvegardes externes, fichiers compatibles S3. Pas de fournisseur acheté ou définitivement choisi. |

## Révisions qui priment sur les décisions antérieures

- Q101 révise Q100 : plus de priorité imposée à ChatGPT Work et plus d'interdiction des API IA. Compatibilité dès V1 par adaptateurs, pas promesse de prise en charge universelle de tout modèle.
- Q101–110 et Q150 remplacent Next.js, Vercel et Supabase comme cible de la V1.
- Q141–142 révisent Q13 sur les scores partiels ; simulation, conformité et score demeurent trois états distincts.
- Q144 précise Q44 : les calendriers publics constituent une base autorisée pour une estimation incertaine, jamais une preuve directe d'occupation.
- Q148 précise Q11 : recalcul automatique asynchrone, avec signalement d'obsolescence.
- Q152 précise Q102 pour le premier hébergement, sans abandonner la portabilité.

## Point de reprise

La série s'est terminée après Q152, acceptée. Aucune question posée ne reste sans réponse.
La consolidation locale est rédigée dans les documents 01 à 06. Les conventions de réalisation ajoutées par l'assistant sont identifiées comme propositions ou paramètres techniques ; elles ne sont pas présentées comme de nouveaux choix utilisateur.

Prochaine étape utile : relire les specs consolidées, puis réaliser les preuves techniques décrites dans [Faisabilité et réalisation](06_Faisabilite_et_realisation_V1.md). Ne pas recommencer l'entretien Q1–152. Aucun développement applicatif, déploiement ni abonnement n'a été effectué pendant cette consolidation.

## Paramètres et preuves restant à finaliser

- Activation réelle du plugin MCP Events/Work sur le compte de l'utilisateur ; progression, annulation et coûts disponibles ; premier fournisseur API et modèle de référence.
- Devis d'infrastructure total et disponibilité, dimensionnement mesuré, stockage et sauvegardes. Aucun prix historique ne vaut engagement de coût.
- Montants des budgets IA, repères de scoring par recherche, hypothèses financières inconnues et fréquences d'actualisation par statut à saisir dans la configuration. Ne pas inventer ces préférences.
- Matrice complète des critères et rubriques probatoires de demande locative/touristique, ainsi que l'agrégation de cette demande pour un immeuble mixte : propositions à évaluer sur un jeu de biens.
- Recette des conventions de calcul, cas limites, reprise, migrations, restauration et exécution multi-fournisseur.

## Références

- [Spécification fonctionnelle](01_Specification_fonctionnelle_ImmoTrack_V1.md)
- [Spécification technique](02_Specification_technique_ImmoTrack_V1.md)
- [Architecture](03_Specification_architecture_ImmoTrack_V1.md)
- [Calculs et cas de référence](05_Calculs_et_cas_de_reference_V1.md)
- [Faisabilité et réalisation](06_Faisabilite_et_realisation_V1.md)
