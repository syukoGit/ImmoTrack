# ImmoTrack V1 — Spécification fonctionnelle

Révision consolidée — 10 octobre 2026, décisions Q1–152.

Ce document décrit le comportement cible. Les conventions de calcul figurent dans le document 05 et les limites de faisabilité dans le document 06. « Validé » désigne un choix utilisateur, pas une fonctionnalité déjà implémentée.

## 1. Objectif et périmètre

ImmoTrack aide un investisseur à rechercher, comparer et suivre des biens immobiliers à partir d'informations collectées par plusieurs agents. L'application conserve les sources, explique les résultats et calcule elle-même les indicateurs financiers. Une recherche doit pouvoir être reproduite et diagnostiquée.

La V1 sert un administrateur unique. Tours et sa métropole constituent le terrain initial, sans limiter les recherches aux seules communes de cette zone. Tous les parcours sont accessibles sur ordinateur et mobile, avec une présentation adaptée, y compris simulations et comparaisons.

Inclus : ventes classiques d'appartements, maisons et immeubles de rapport ; lots d'habitation, commerces, bureaux, parkings et garages ; longue durée nue/meublée/colocation et saisonnier ; recherche automatisée, saisie manuelle, analyses documentaires à la demande, simulations avant fiscalité, comparaison et exports.

Hors périmètre : enchères, viagers, fiscalité/comptabilité exhaustive, analyse juridique des baux, CRM structuré de visites/actions/échéances, offres d'achat, automatisation bancaire, application mobile native et gestion multi-utilisateur complexe. La consommation d'API IA est incluse dans la V1. Les mécanismes de navigation/collecte appartiennent aux intégrations d'agents ; ils ne sont pas des règles métier du domaine.

## 2. Vocabulaire et responsabilités

| Concept | Sens |
| --- | --- |
| Bien | Objet immobilier commun à toutes les recherches, contenant un ou plusieurs lots. |
| Lot | Unité d'usage/location. Une maison ou un appartement simple contient un lot, masqué comme tel dans l'interface si inutile. |
| Annonce | Publication d'un bien sur une source, avec référence et URL. Plusieurs annonces peuvent représenter le même bien. |
| Observation | Information collectée à une date, avec source, preuve et nature observée/estimée. |
| Recherche | Objectifs, zone, sources, critères, hypothèses et programmation versionnés. |
| Dossier bien–recherche | Rattachement portant qualification, hypothèses spécifiques, simulation et évaluation. |
| Exécution | Réalisation d'une recherche avec critères figés et suivi par source. |
| Tâche / tentative | Travail demandé à un agent et une tentative concrète avec un agent donné. |
| Simulation | Une simulation par bien et recherche, comportant un scénario central et un dégradé. |
| Évaluation | Résultat versionné des calculs, conformité, score et qualité des données. |

L'administrateur décide et corrige. L'agent apporte observations, estimations sourcées et suggestions. ImmoTrack valide, historise, rapproche et calcule. Un agent ne peut pas modifier librement les critères, les hypothèses manuelles ou la qualification.

## 3. Recherches et critères

Plusieurs recherches indépendantes peuvent être actives. Chaque recherche possède :

- Un type longue durée ou saisonnier, un nom et une activation automatique.
- Des zones par communes, codes postaux ou rayon autour d'un lieu, avec exclusions.
- Un choix de sources dans un catalogue commun.
- Des critères prédéfinis : seuils, caractère éliminatoire et préférences. Pas d'éditeur libre de formules en V1.
- Des hypothèses financières communes, des pondérations et repères de scoring.
- Une programmation par jours et heure en Europe/Paris, quotidienne par défaut.
- Des fréquences d'actualisation des biens connus selon leur statut.
- Une sélection d'agent et de relais autorisés, parmi les intégrations compatibles.

Les seuils financiers utilisent l'année stabilisée centrale. Les plafonds de prix d'achat et de coût total sont facultatifs et indépendants. Les hypothèses d'une recherche sont héritées par ses dossiers ; une modification déclenche leur recalcul sans effacer les ajustements propres à un bien.

La localisation insuffisante et toute donnée nécessaire à un critère éliminatoire absente conduisent à « à vérifier », pas à conforme ni à exclu. Une valeur invalide est rejetée ; elle ne devient pas une valeur absente silencieusement.

Les critères sont appliqués aux lots concernés. Un lot non conforme rend le projet non conforme ; les motifs restent détaillés par lot. Les critères touristiques ne s'appliquent qu'aux lots saisonniers. Un critère éliminatoire peut faire l'objet d'une dérogation manuelle par recherche, avec motif et badge. Si la donnée concernée change, la dérogation est à reconfirmer et le bien sort du classement conforme entre-temps.

## 4. Collecte et suivi des exécutions

### 4.1 Parcours nominal

1. La programmation ou une demande manuelle crée une exécution avec une version figée des critères.
2. ImmoTrack vérifie activation, capacité, intégration et budget, puis confie le travail à l'agent choisi.
3. L'agent consulte les sources et envoie progressivement des lots structurés et des preuves.
4. ImmoTrack valide les lots, conserve les éléments acceptés, signale les rejets et programme les évaluations.
5. L'interface affiche les résultats disponibles et indique que la recherche continue.
6. La clôture indique réussite, résultat partiel, échec ou interruption, avec détail par source et couverture réelle.

Une seule exécution peut être active pour une recherche. Une nouvelle demande renvoie vers celle-ci, sans ajouter une exécution de remplacement. Des recherches différentes peuvent avancer simultanément dans les limites configurées. Les tâches en attente de capacité sont conservées ; les demandes manuelles sont prioritaires sans priver indéfiniment les tâches programmées.

Aucun plafond fonctionnel du nombre d'annonces n'est fixé. La collecte vise tous les résultats pertinents accessibles ; une limite de temps, budget, fournisseur ou source doit produire un résultat signalé incomplet. L'application ne promet pas l'exhaustivité d'une source inaccessible.

### 4.2 Incidents, arrêt et reprise

- Erreur temporaire d'une source : une tentative supplémentaire automatique, puis alerte et relance ciblée possible. Une demande d'intervention humaine n'entraîne pas de boucle de tentatives.
- Interruption technique : reprise au dernier point fiable lorsque l'intégration le permet, avec tentatives bornées. Les résultats déjà acceptés sont conservés.
- Blocage : délais d'inactivité et durée totale adaptés à l'intégration ; la tentative ancienne perd le droit d'écrire avant une reprise.
- Relais : agents de secours selon la liste autorisée ; sans liste, action manuelle. Ne pas promettre le transfert d'un contexte interne entre fournisseurs.
- Arrêt demandé : stopper la distribution, demander l'annulation externe si disponible, refuser les nouvelles écritures de la tentative invalidée et conserver les résultats déjà enregistrés. Un calcul externe peut continuer à consommer jusqu'à son arrêt effectif.
- Rattrapage après indisponibilité : une seule exécution, même si plusieurs créneaux ont été manqués.
- Pause ou archivage : arrêter la collecte de la recherche et conserver critères, résultats et historiques. Pas de suppression définitive de recherche en V1.

## 5. Biens, lots et qualité des informations

Une fiche commune regroupe identification, caractéristiques, annonces, prix observés, pièces jointes, notes et contacts. Les qualifications et simulations sont propres à chaque recherche. La qualification comprend notamment nouveau, à analyser, présélectionné, contacté et écarté. Elle est indépendante de la conformité, de la disponibilité et de la complétude.

Le bien porte adresse/localisation, type, surfaces avec leur nature, pièces, étage, ascenseur, copropriété, DPE et état/travaux lorsque disponibles. Chaque lot porte usage, surface, occupation, loyer, charges, mode de location et calendrier. Les caractéristiques communes et celles par lot doivent être distinguées.

### 5.1 Provenance et corrections

Les observations conservent source, date, nature et preuve. Les estimations conservent méthode et références. Une correction manuelle est prioritaire jusqu'à retrait explicite ; les nouvelles observations contradictoires restent visibles sans l'écraser. Sans correction, utiliser la valeur observée la plus récemment selon Q54, en signalant les désaccords. La convention pour les égalités de dates est précisée dans la spec technique.

Une donnée inconnue reste distincte de zéro. Prix ou surface peuvent manquer si l'annonce est identifiable et pertinente ; les indicateurs dépendants sont indisponibles. L'interface distingue observé, estimé, hypothèse et correction manuelle, ainsi que le caractère provisoire de la simulation.

Deux onglets ne doivent pas écraser silencieusement leurs modifications : une version dépassée produit un conflit à arbitrer avec affichage de la valeur courante et de la proposition.

### 5.2 Rapprochement et disponibilité

Même source/référence ou URL canonique identifient une annonce connue. Les rapprochements entre annonces de sources différentes s'appuient sur des indices documentés. En cas d'incertitude, conserver les biens séparés et proposer un rapprochement. Une fusion peut être annulée ; l'utilisateur choisit où rattacher notes et corrections, sans perdre l'historique.

Une annonce retirée devient indisponible uniquement sur preuve suffisante. Une erreur réseau, un CAPTCHA ou une absence dans une page de résultats ne prouve pas un retrait. Si toutes les annonces sont indisponibles, le bien sort des opportunités actives mais conserve historique et suivi. Une fiche sans annonce reste actualisée manuellement ; elle ne devient pas indisponible du seul fait de n'avoir aucune annonce.

Écarter un bien peut viser une recherche ou toutes. Une baisse de prix peut créer une alerte de réexamen, sans rétablir automatiquement le bien. Un bien devenu non conforme reste rattaché avec motifs et historique, hors classement conforme.

## 6. Saisie, documents et contacts

L'administrateur peut demander la collecte d'une URL ou créer une fiche sans lien, rattachée à une recherche. Ajouter ensuite une annonce permet le suivi automatique.

Les photos sont copiées avec provenance pour rester consultables après disparition de l'annonce. L'agent récupère les plans accessibles rencontrés pendant la collecte. Diagnostics, taxe foncière, devis, copropriété et autres pièces jointes sont consultables/téléchargeables depuis un stockage privé.

L'analyse documentaire est déclenchée à la demande depuis une fiche. L'agent propose des extractions avec document/page source et distingue mesures inscrites et interprétations, notamment pour surfaces, pièces et dispositions sur plans. Aucune proposition n'alimente les données ou calculs avant validation humaine. Une nouvelle analyse ne remplace pas une correction déjà validée.

Contacts : coordonnées, dernière date de contact et notes libres, communs au bien. Pas de CRM structuré de visites ou tâches commerciales en V1.

## 7. Simulations financières

### 7.1 Organisation

Une simulation par bien et recherche contient central et dégradé. Les hypothèses de recherche sont ajustables par bien, et par lot lorsque pertinent. Les évaluations sont historisées avec leurs entrées et version du calculateur. Un recalcul en arrière-plan signale les résultats précédents comme obsolètes ; ils ne représentent pas les nouvelles hypothèses.

Deux lectures : première année réelle avec travaux/mise en location et année stabilisée théorique. La trésorerie est projetée au moins sur 12 mois et jusqu'à fin des travaux/mise en location de tous les lots, au maximum sur 36 mois avec alerte au-delà.

### 7.2 Coût et financement

Coût détaillé : achat, frais d'acquisition, honoraires d'agence sans double comptage, travaux, mobilier, frais de financement. Le prix affiché est la référence initiale ; un prix négocié envisagé est une hypothèse séparée de l'historique des annonces.

Financement : apport fixé et crédit calculé, crédit fixé et apport calculé, ou comptant. Tout le crédit est débloqué à l'acquisition, y compris la part travaux. Remboursement immédiat par défaut ou différé de capital, avec intérêts et assurance payés pendant le différé. La durée totale inclut le différé. Assurance calculée sur capital initial ou restant dû. La réserve de trésorerie est distincte de l'apport.

Les échéances de financement interviennent dans le cash-flow, pas dans le rendement net d'exploitation. L'année stabilisée utilise douze échéances normales après différé ; pour l'assurance sur capital restant dû, les douze premiers mois d'amortissement sont la référence.

### 7.3 Revenus, charges et calendrier

Lot loué : loyer pratiqué ; lot vacant : estimation documentée. Afficher séparément le potentiel locatif. Colocation : revenu et vacance au niveau du logement, sans modélisation par chambre. Un revenu global déclaré peut être utilisé provisoirement pour l'immeuble, sans inventer sa répartition. Le détail incomplet n'est pas ajouté au global ; un écart lors de la complétude exige validation avant bascule.

Longue durée : vacance en semaines/an lissée sur les mois disponibles, distincte du délai initial. Impayés : taux de perte sur loyers attendus après vacance, nul par défaut. Charges par lot et communes ; séparer récupérable/non récupérable et éviter tout double comptage. Des hypothèses configurées peuvent remplacer charges, taxe ou travaux inconnus, avec signalement ; elles ne remplacent pas les preuves requises pour les revenus.

Les travaux ont durée et calendrier de dépense par lot/parties communes, initialement répartis sur leur durée et ajustables mois par mois. Le délai avant loyers est spécifié par lot, avec valeurs communes par défaut.

### 7.4 Saisonnier

Prix par nuit et occupation par mois, avec valeurs annuelles par défaut pour faciliter la saisie. Frais de plateforme et conciergerie, ménage/linge par séjour, consommables et charges fixes. Durée moyenne du séjour pour estimer les séjours. Séparer montants facturés aux voyageurs et dépenses réellement supportées.

La faisabilité saisonnière non vérifiée maintient une alerte et une simulation provisoire, sans conformité acquise. La demande touristique est documentée distinctement de la demande locative.

Un immeuble mixte avec commerces ou logements longue durée peut appartenir à une recherche saisonnière. Les revenus restent séparés par usage ; l'évaluation financière porte sur l'ensemble. Dans cette recherche, classer séparément les biens entièrement saisonniers et les immeubles mixtes.

### 7.5 Estimations et scénario dégradé

Loyer longue durée estimé : trois biens comparables distincts au minimum, références de moins de six mois, sources consultables et justification des différences. Une republication ne constitue pas un comparable supplémentaire. Distinguer prix demandés et loyers réellement pratiqués. Sans preuves suffisantes, le revenu reste inconnu ; saisie manuelle possible.

Pour le saisonnier, documenter les prix et l'occupation mensuels avec références locales. Les calendriers publics peuvent contribuer à une estimation incertaine de l'occupation ; une indisponibilité n'est jamais directement assimilée à une réservation payante. Méthode, sources et incertitude sont visibles, et la simulation demeure provisoire. La convention proposée sur les comparables de nuitées figure au document 05.

Dégradé par défaut : loyers longue durée −10 %, vacance +2 semaines/an, prix par nuit −10 %, occupation −10 points, dépenses d'exploitation propriétaire +10 %, travaux initiaux +15 %. Écarts cumulés, configurables par recherche et ajustables par bien. Bornes physiques conservées, inconnus non inventés. Le crédit reste celui du central ; le dépassement de travaux augmente le besoin de fonds personnels/réserve.

## 8. Conformité, score et comparaison

Ne pas confondre quatre axes : conformité, qualification, qualité de simulation et disponibilité. Un score provisoire ne rend pas conforme un bien dont un critère éliminatoire est inconnu. Une simulation obsolète ne devient pas simplement « provisoire » : elle appartient à une version antérieure.

Le score est déterministe et explicable. Poids initiaux : rendement net sur coût total 40 %, cash-flow mensuel stabilisé 40 %, demande locale 20 %. Poids ajustables ; les contributions sont visibles. Profils par stratégie proposés, conservant ces poids initiaux et adaptant la demande locale.

Pour les finances : note linéaire entre niveau bas et cible configurés, bornée entre 0 et 100. Pour la demande : cinq niveaux 0/25/50/75/100, preuves datées et grille adaptée au locatif/touristique. Les niveaux bas/cibles ne constituent pas les seuils éliminatoires.

Une dimension inconnue de poids non nul contribue pour 50/100 : score marqué provisoire, avec part pondérée documentée. Cela n'invente aucune donnée dans la simulation. Si toutes les dimensions actives sont inconnues, score non calculable. Un poids nul n'affecte ni score ni complétude pondérée.

Scores complets et provisoires partagent le même classement, avec badges. Maintenir les sections conforme/à vérifier, les recherches distinctes et la séparation saisonnier pur/mixte. Aucun classement global mélangeant longue durée et saisonnier. Comparaison côte à côte uniquement dans une même recherche et selon ces séparations : caractéristiques, coût, rendements, trésorerie, score et inconnus.

## 9. Administration, sécurité et exploitation visibles

L'administrateur se connecte via un compte Keycloak avec double authentification. Les intégrations ont des identités séparées. Le navigateur n'expose ni les jetons fournisseurs ni les secrets agents.

L'administration configure les intégrations prises en charge, modèles, capacités, agents par défaut, exceptions par tâche/recherche, relais, limites de concurrence, délais et budgets. Le fournisseur d'un nouveau protocole nécessite un adaptateur ; saisir un nom de modèle ne prouve pas ses capacités de collecte, vision ou documents.

Budget API mensuel global et plafond par tâche partagé entre tentatives/relais. Consommation connue et estimée distinguées. À l'atteinte : suspendre les nouveaux appels concernés et alerter ; une requête déjà engagée peut encore coûter. Montants configurés explicitement avant activation payante.

Chronologie des tâches : étape, résultats, sources, tentatives, relais, dernière activité, incidents et coût connu. Aucun raisonnement interne de modèle ni secret. Alertes dans l'application avec récapitulatif au dashboard, sans e-mail V1.

Biens, historique métier et pièces jointes sans expiration automatique. Journaux techniques : 90 jours par défaut, configurable. Sauvegardes quotidiennes chiffrées hors serveur, 30 jours quotidiens et 12 mensuelles ; objectifs perte ≤24 h et restauration ≤24 h, à vérifier par exercice. Déploiement manuel après contrôles, avec maintenance courte. Budget infrastructure ≤20 €/mois hors API, soumis au volume et au chiffrage réel.

## 10. Écrans et exports

| Écran | Contenu |
| --- | --- |
| Dashboard | Activité globale, alertes, recherches actives et classements séparés. |
| Recherches | Création/configuration, zones, sources, critères, hypothèses, profils et programmation. |
| Résultats | Filtres, tris, conformité, qualification, disponibilité, scores provisoires et données manquantes. |
| Fiche bien | Lots, annonces, provenance, historique, notes, contacts, corrections et documents. |
| Simulation | Central/dégradé, année 1/stabilisée, trésorerie mensuelle, réserve et hypothèses héritées/ajustées. |
| Comparaison | Biens d'une même recherche, respect des catégories de stratégie. |
| Exécutions/tâches | Progression, sources, résultats partiels, chronologie, arrêt et relance ciblée. |
| Rapprochements | Candidats, fusion confirmée, annulation et rattachement des données humaines. |
| Administration | Agents/modèles/accès, budgets, limites, paramètres techniques et état des sauvegardes. |

Exports depuis l'interface : CSV des résultats et JSON détaillé des hypothèses, évaluations et historiques. Aucun secret ou jeton dans les exports. Les états provisoire/obsolète et les versions doivent accompagner les indicateurs exportés.

## 11. Recette fonctionnelle minimale

1. Collecter une annonce deux fois sans doubler bien, observations identiques, compteurs ou évaluations.
2. Conserver les éléments valides d'une source même si une autre échoue ; permettre la relance ciblée.
3. Montrer une baisse de prix et une alerte de réexamen sans annuler l'exclusion humaine.
4. Préserver une correction manuelle face à une observation contradictoire et gérer un conflit entre onglets.
5. Recalculer une recherche après modification sans effacer les ajustements par bien ni afficher un ancien calcul comme courant.
6. Passer d'un revenu global à un détail complet sans double comptage ; requérir validation si écart.
7. Produire les cas financiers de référence du document 05, y compris comptant, taux nul, différé et données manquantes.
8. Afficher un score provisoire imputé à 50, sa part documentée et la conformité indépendante.
9. Garder les stratégies et catégories de comparaison séparées, y compris les immeubles mixtes.
10. Valider une extraction documentaire avant toute application et conserver la page source.
11. Arrêter une tâche, invalider une ancienne tentative et conserver les résultats déjà acceptés.
12. Restaurer base, documents, identité et secrets nécessaires dans le délai visé, sans rejouer involontairement d'anciens appels payants.

## 12. Références

- [Journal des décisions](04_Decisions_et_reprise_spec_V1.md)
- [Spécification technique](02_Specification_technique_ImmoTrack_V1.md)
- [Architecture](03_Specification_architecture_ImmoTrack_V1.md)
- [Calculs et exemples](05_Calculs_et_cas_de_reference_V1.md)
- [Faisabilité et plan de réalisation](06_Faisabilite_et_realisation_V1.md)
