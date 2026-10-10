# ImmoTrack V1 — Faisabilité et réalisation

Vérification documentaire au 10 octobre 2026. Aucun fournisseur acheté, aucun service déployé, aucun essai authentifié d'agent réalisé.

## 1. Ce qui est décidé et ce qui reste à prouver

La V1 doit accueillir ChatGPT Work et des agents par API dès sa conception, sans fournisseur privilégié imposé. Les décisions Q145–147 donnent une architecture et un contrat communs. Leur faisabilité doit être vérifiée intégration par intégration : déclencher une exécution, en recevoir les résultats, l'arrêter et suivre son coût sont des capacités différentes.

Une vérification documentaire démontre l'existence d'un mécanisme décrit publiquement. Elle ne démontre ni son activation sur le compte de l'utilisateur, ni l'accès aux sources immobilières, ni le respect des limites de coût ou de temps en conditions réelles.

## 2. ChatGPT Work : voie événementielle documentée

La documentation officielle [MCP Events](https://developers.openai.com/plugins/build/mcp-events) décrit un serveur MCP exposant des événements, une souscription créée depuis Work, puis l'envoi d'événements signés vers un callback ChatGPT. La réception est asynchrone : un accusé HTTP ne signifie pas que la mission est terminée.

**Application proposée à ImmoTrack :** un plugin expose un événement de mission disponible et des outils limités pour lire la mission, envoyer observations/progression et clôturer. Une tâche Work préalablement configurée s'abonne ; ImmoTrack émet l'événement après réservation de la mission. Le même identifiant survit aux nouvelles tentatives de livraison. Les permissions du compte et les confirmations éventuelles restent applicables.

Cette voie nécessite un prototype : souscription, expiration, doublon, réception sans session ouverte, retour structuré et interruption. La documentation ne suffit pas à garantir une API d'annulation ni un coût détaillé par mission ; ces capacités restent inconnues tant que testées. Le flux retour doit passer par le contrat ImmoTrack, pas par la lecture libre d'une conversation.

La page [ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex) confirme des tâches programmées ou événementielles pour les comptes éligibles, avec permissions et disponibilité variables. La programmation des recherches restera pilotée par ImmoTrack afin d'éviter deux planificateurs concurrents.

## 3. Workspace Agents : voie distincte documentée

Le guide officiel [Trigger a Workspace Agent from the API](https://developers.openai.com/cookbook/examples/chatgpt/workspace_agents/workspace-agents-api-trigger) décrit un déclenchement HTTPS asynchrone d'un agent enregistré, via un canal API et un jeton autorisé. Il requiert un espace éligible et une destination dans laquelle l'agent peut écrire. Le déclencheur ne retourne pas la réponse finale.

Il s'agit d'une autre intégration possible, pas de la preuve qu'une conversation Work quelconque est pilotable via cette API. Ne pas confondre compte ChatGPT, Workspace Agent et API de modèles. L'autorisation du compte, le retour vers ImmoTrack, la progression, l'arrêt et la consommation doivent être vérifiés séparément.

## 4. Matrice de recette des intégrations

| Capacité | Agent piloté par worker via API | Work via plugin/événements | Workspace Agent via déclencheur |
| --- | --- | --- | --- |
| Démarrage depuis ImmoTrack | À implémenter/tester avec le fournisseur choisi | Mécanisme documenté ; souscription et éligibilité à tester | Mécanisme documenté ; accès/canal à tester |
| Collecte des sites immobiliers | Outils et accès sources à tester | Accès navigation/sources à tester | Outils/sources autorisés à tester |
| Envoi de lots/provenance | Adapter vers contrat commun | Outils MCP à développer/tester | Destination/outils à développer/tester |
| Progression | Événements contrôlés par le worker et usage fournisseur | Émissions via outils, couverture à tester | Couverture à tester |
| Arrêt externe effectif | Dépend de l'API ; arrêt local des nouveaux appels possible | Non établi | Non établi |
| Rejet des résultats périmés | ImmoTrack garantit par génération | Même garantie côté ImmoTrack | Même garantie côté ImmoTrack |
| Reprise exacte | Selon état et checkpoint persistant | Non garantie | Non garantie |
| Budget par mission | Tarifs/usage/outils et réservation à implémenter | Visibilité non établie ; quotas de plan distincts | Visibilité non établie |

Pour qualifier « multi-modèle opérationnel dès V1 », la recette doit couvrir au moins deux configurations de fournisseurs/modèles réellement utilisables, avec mêmes tests contractuels, ainsi que la voie Work demandée. Le fournisseur et les identifiants des modèles API de référence ne sont pas encore choisis ; la liste de l'UI devra refléter les adaptateurs livrés et les accès configurés. Un adaptateur fictif ne satisfait pas la recette multi-fournisseur.

## 5. Hébergement : candidat chiffré, sous hypothèses

Décision : VPS Docker et plafond de 20 €/mois hors API. Proposition à comparer au panier réel avant commande : serveur x86 de classe 4 vCPU/8 Go, stockage externe S3 pour médias et sauvegardes. Il s'agit d'un dimensionnement initial à tester, pas d'une mesure de charge.

Sources officielles consultées : [tarifs cloud Hetzner mis à jour en juin 2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [caractéristiques et disponibilité CX33](https://www.hetzner.com/cloud/cost-optimized/), [IPv4](https://docs.hetzner.com/cloud/servers/primary-ips/overview/) et [tarifs stockage Scaleway](https://www.scaleway.com/en/pricing/storage/).

| Poste candidat | Hypothèse | Coût mensuel HT indicatif |
| --- | --- | ---: |
| Hetzner CX33 Europe | 4 vCPU, 8 Go RAM, 80 Go disque | 8,49 € |
| IPv4 publique | Une adresse | 0,50 € |
| Objets Scaleway Multi-AZ | 200 Go cumulés, médias et sauvegardes compris, à 0,01606 €/Go/mois | 3,21 € |
| Total de ces postes | Hors dépassements et domaine | 12,20 € |

Avec une **hypothèse de TVA à 20 %**, ces postes représentent environ **14,64 €/mois TTC**. Une enveloppe de 1,50 €/mois pour un éventuel domaine, purement budgétaire et non issue d'un devis, porterait le total à environ 16,14 €. La taxe réelle dépend du compte de facturation. La page du serveur consultée signale une indisponibilité : ce candidat tarifaire ne constitue donc pas une offre immédiatement commandable confirmée.

Les 200 Go sont un scénario de dimensionnement, pas une limite fonctionnelle validée ni une prévision du volume. Ils doivent comprendre toutes les copies retenues pendant 30 jours et un an ; utiliser une sauvegarde dédupliquée/incrémentale avec restauration testée, ou recalculer la consommation réelle. Les photos inchangées ne doivent pas être recopiées intégralement 42 fois sans chiffrage. Conserver médias et sauvegardes dans des espaces d'accès distincts, identifiants séparés et protection contre l'effacement des sauvegardes depuis l'application.

Le stockage est facturé selon volume/durée ; le trafic sortant au-delà du quota inclus peut augmenter le coût. Le devis final doit inclure mois long, trafic, sauvegardes, domaine et éventuels frais. Aucun essai gratuit temporaire n'est utilisé pour justifier ce budget. Les abonnements ChatGPT déjà détenus ne sont pas chiffrés comme infrastructure et ne rendent pas les API gratuites.

**Conclusion de faisabilité :** l'enveloppe paraît atteignable pour un petit volume, mais n'est pas garantie pour une croissance sans expiration des médias. Ne pas lancer de commande tant que disponibilité, dimensionnement et total réel ne sont pas vérifiés.

## 6. Ordre de réalisation testable

Ces tranches organisent le travail ; elles ne retirent aucune fonctionnalité du périmètre V1.

| Tranche | Résultat vérifiable |
| --- | --- |
| T0 — Preuves agents et coût | Mission factice Work événementielle avec retour de lot ; deux configurations API ; contrôle des capacités ; devis et mesure mémoire/CPU. |
| T1 — Socle | Solution .NET/React, frontières de dépendance, Compose local, PostgreSQL, Keycloak MFA/BFF, CI. |
| T2 — Premier parcours | Créer recherche, lancer tâche, ingérer annonce, afficher bien/lot et provenance ; arrêt et rejeu sans doublon. |
| T3 — Simulations | Calculateur pur, hypothèses versionnées, central/dégradé, trésorerie, cas du document 05 et recalcul asynchrone. |
| T4 — Collecte résiliente | Programmation Paris, sources multiples, budgets, concurrence, relais, reprise, diagnostics et couverture incomplète. |
| T5 — Produit complet | Immeubles/mixte/saisonnier, rapprochement/défusion, critères/dérogations, scoring, comparaison et qualification. |
| T6 — Documents et exploitation | Photos/plans, suggestions validées, exports, responsive complet, sauvegarde/restauration, déploiement manuel et maintenance. |

Un premier parcours partiel est une étape d'implémentation, pas une redéfinition silencieuse de la V1. Les contrats des agents sont testés d'abord avec des fixtures avant de consommer des API réelles.

## 7. Points ouverts identifiés, sans nouvel entretien systématique

| Point | Nature | Action nécessaire |
| --- | --- | --- |
| Fonctionnalités activées sur le compte Work | Preuve technique/accès | Tester plugin et événement sur le compte cible. |
| Fournisseurs API et modèles de référence | Configuration de livraison | Choisir parmi accès disponibles, tester le contrat et borner coûts/capacités. |
| Seuils financiers et montants budgets IA | Préférence utilisateur | Configuration explicite par l'administrateur, pas de valeur inventée. |
| Rubrique de demande et agrégation mixte | Convention métier proposée | Évaluer sur des exemples réels avant recette du scoring. |
| Rapprochement entre sources et critères de retrait | Calibration par source | Construire fixtures de vrais cas et faux positifs ; conserver séparation en cas d'incertitude. |
| Jeux financiers complémentaires | Recette | Vérifier cas mixtes, saisonniers, calendrier et assurance/arrondis. |
| Versions et bibliothèques de réalisation | Choix technique | Retenir versions supportées, licences compatibles, images épinglées. |
| Coût réel et disponibilité serveur | Preuve économique | Actualiser panier et volume cumulé des sauvegardes. |
| RPO/RTO | Preuve opérationnelle | Mesurer restauration complète ; pas seulement vérifier présence d'un fichier de sauvegarde. |

Le périmètre et le socle architectural sont consolidés. La spec ne doit pas être annoncée comme prête à déployer tant que les conditions de recette ci-dessus ne sont pas démontrées.
