# Documentation ImmoTrack

## Cadrage en cours — reprise au 10 octobre 2026

Les **100 décisions validées** lors de l’entretien sont enregistrées dans [Décisions et reprise de la spec V1](04_Decisions_et_reprise_spec_V1.md). Ce document complète les spécifications initiales et prévaut sur elles pour les points explicitement modifiés. La spec finale consolidée reste à rédiger.

**Le passage à l’architecture a été annoncé. Reprendre à la question 101, encore sans réponse : conserver la stack TypeScript / Next.js / Vercel / Supabase, ou la réexaminer ?** Continuer avec une seule question à la fois. Le document de reprise contient les choix détaillés, les évolutions de périmètre et les sujets restant à traiter. Les trois spécifications ci-dessous n’intègrent pas encore ces décisions.

Les trois spécifications V1 décrivent le produit, son implémentation et son architecture. Les versions Markdown reprennent le contenu des documents Word datés du 3 octobre 2026, sans modification de fond. Les titres, listes, tableaux et exemples ont été adaptés au format Markdown.

- [Spécification fonctionnelle](01_Specification_fonctionnelle_ImmoTrack_V1.md)
- [Spécification technique](02_Specification_technique_ImmoTrack_V1.md)
- [Spécification d’architecture](03_Specification_architecture_ImmoTrack_V1.md)

Les originaux restent dans `WIP/`, actuellement ignoré par Git. Les fichiers Markdown de ce dossier peuvent être versionnés. La spécification technique propose une future arborescence `docs/` en minuscules ; le nom existant `Docs/` a été conservé pour cette conversion.

## Premier avis

Le socle est cohérent : l’agent collecte les faits, l’application porte les décisions métier et les calculs. L’historisation, les hypothèses versionnées, l’idempotence et les erreurs corrélées répondent directement au besoin de rendre les recherches explicables. Les critères d’acceptation fonctionnels constituent un bon départ pour les tests.

La V1 couvre néanmoins beaucoup de sujets : ingestion, rapprochement multi-source, calculs, scoring, suivi des recherches et plusieurs écrans. Avant de créer toute l’architecture proposée, il faut définir un premier parcours complet et préciser les règles qui déterminent son résultat.

## Points à clarifier

1. **Premier parcours et périmètre.** Choisir le canal initial d’import, les données minimales et les écrans indispensables. Décider quels niveaux de déduplication et quelles règles de scoring sont nécessaires pour ce premier parcours.
2. **Bien et annonce.** Les documents distinguent un bien de ses annonces sources, mais nomment le bien `Listing`. Clarifier le vocabulaire, les identifiants, les seuils de rapprochement, la validation des candidats et la possibilité d’annuler une fusion erronée. Une adresse et une surface proches ne suffisent pas toujours à identifier un logement dans un immeuble.
3. **Échecs partiels et transactions.** La spécification technique prévoit une erreur de validation sans écriture métier, tandis que le résultat d’ingestion comprend des éléments rejetés. Définir séparément une enveloppe invalide, une annonce invalide dans un lot valide et une source en échec. Préciser ce qui est conservé, annulé et rejouable dans chaque cas.
4. **Idempotence et concurrence.** Définir le périmètre et la durée de conservation d’une clé, le résultat d’une même clé avec un contenu différent, le traitement de deux requêtes simultanées et la reprise après interruption. Le rejeu doit couvrir aussi les snapshots, évaluations et compteurs.
5. **Cycle de vie des recherches.** Définir qui crée et clôture le run, les statuts et transitions autorisés, le rôle des lots successifs, les sources attendues, les expirations et la relance d’une source. Le contrat fournit un `runId`, mais ne décrit pas encore ce cycle complet.
6. **Provenance et corrections.** Définir la priorité entre observation, estimation et saisie utilisateur pour chaque champ. Une nouvelle ingestion doit-elle remplacer une correction manuelle ? Définir aussi le traitement des valeurs inconnues, qui doivent rester distinctes de zéro.
7. **Calculs et scoring.** Fixer les formules, unités, périodes, assiettes, arrondis, frais financés, assurance et scénarios. Décrire les contributions au score, les données manquantes et les motifs de rejet. Ajouter des exemples chiffrés avec résultats attendus avant l’implémentation.
8. **Accès et exploitation.** Définir comment le compte administrateur autorisé est identifié, les permissions du credential agent, les politiques RLS, les sauvegardes/restaurations et la rétention des payloads et logs. Une session authentifiée doit être associée à une autorisation explicite.

## Ordre de travail proposé

Ces étapes sont une proposition de travail ; elles ne modifient pas les spécifications converties.

1. **Cadrer le premier parcours fonctionnel.** Décrire un import, la consultation du bien, une correction d’hypothèse et le résultat attendu. Définir le minimum livrable et les critères d’acceptation observables.
2. **Stabiliser le vocabulaire et les règles de données.** Bien, annonce, observation, correction, évaluation, run et lot ; invariants, provenance et transitions.
3. **Définir le contrat d’ingestion.** Requêtes/réponses et exemples de succès, rejet partiel, conflit d’idempotence, reprise et clôture de run.
4. **Spécifier les calculs.** Formules et cas de référence, notamment achat comptant, taux nul, données manquantes et scénario dégradé.
5. **Aligner technique et architecture.** Ajuster schéma, frontières, transactions et ADR aux décisions précédentes, puis démarrer une première tranche fonctionnelle testable.

La prochaine étape recommandée est la première : rendre le parcours initial suffisamment précis pour décider quoi construire en premier.
