# ImmoTrack V1 — Spécification technique

Révision consolidée du 10 octobre 2026 — .NET, React TypeScript, PostgreSQL.

Les choix structurants sont validés dans le journal Q1–152. Les noms d'API, schémas et paramètres techniques de ce document constituent une proposition de réalisation cohérente avec ces choix. Ils doivent passer la recette de contrat ; aucune intégration externe n'est déclarée testée sur la seule base de cette spec.

## 1. Principes

- Domaine et application indépendants d'ASP.NET Core, EF Core, PostgreSQL, Keycloak, HTTP et des SDK IA.
- Cas d'usage explicites, injection par constructeurs, interfaces ciblées ; aucun service global mutable ni service locator dans le domaine.
- Validations à l'entrée, invariants dans le domaine, contraintes de cohérence en base. Pas de règles financières dans les contrôleurs, composants React ou repositories.
- Écritures EF Core et migrations versionnées ; lectures dédiées, SQL ciblé autorisé dans l'infrastructure. Aucun IQueryable/DbContext traversant un port.
- Calculs déterministes et versionnés. Horloge et génération d'identifiants injectées. Aucune valeur monétaire binaire flottante comme référence.
- Une commande n'est acceptée que pour une identité autorisée et un périmètre précis. La validation de schéma ne vaut pas autorisation.

## 2. Organisation proposée du dépôt

```text
apps/
  web/                         # React TypeScript ; client généré OpenAPI
src/
  ImmoTrack.Api/               # ASP.NET Core, BFF, HTTP/MCP, composition
  ImmoTrack.Worker/            # planification, file durable, exécution
  ImmoTrack.Domain/            # modules et calculateurs purs
  ImmoTrack.Application/       # cas d'usage, ports, coordination
  ImmoTrack.Infrastructure/    # EF/PostgreSQL, S3, identité, agents/modèles
  ImmoTrack.Contracts/         # DTO et schemas HTTP versionnés
tests/
  Domain.Tests/
  Application.Tests/
  Integration.Tests/
  Contract.Tests/
  Architecture.Tests/
  EndToEnd/
deploy/                       # images, Compose, sauvegarde/restauration
Docs/                         # specs, journal et ADR de réalisation
```

Les modules sont des frontières internes au monolithe, pas des microservices. Chaque module maîtrise ses écritures ; les lectures transverses passent par des ports/projections. L'API et le worker composent les mêmes cas d'usage, sans recopier leur logique. Version LTS .NET supportée, versions EF/Npgsql compatibles et images épinglées à choisir lors de l'initialisation.

## 3. Modèle persistant

Les noms ci-dessous sont indicatifs ; les responsabilités et contraintes sont normatives.

| Ensemble | Données et contraintes |
| --- | --- |
| searches, search_versions | Identité stable, type, activation ; versions immuables de zones, critères, hypothèses et scoring. |
| search_schedules | Jours/heure Europe/Paris, dernier créneau traité, prochain créneau ; unicité d'un créneau par recherche. |
| properties, property_units | Bien et lots ; usage/localisation/surface, versions optimistes. |
| source_listings | Annonces ; unicité source/référence quand présente ; mapping d'URL canonique. |
| observations, evidence | Faits collectés, observed_at, received_at, source, preuve, nature observée/estimée ; append-only. |
| manual_overrides | Correction, périmètre, auteur, date/version, champ ; retrait explicite historisé. |
| property_searches | Unicité bien/recherche ; qualification, exclusions locales, hypothèses spécifiques. |
| global_exclusions | Exclusion commune, motif, historique de réexamen ; distincte des exclusions locales. |
| simulations, input_snapshots, evaluations | Unicité simulation bien/recherche ; instantanés immuables central/dégradé ; versions et génération cible. |
| criterion_exceptions | Critère/recherche/bien ou lot, motif, version des données dérogées et confirmation. |
| duplicate_candidates, merge_operations | Indices, décision, anciennes appartenances et rattachement des données humaines pour défusion. |
| attachments, document_suggestions | Clé objet privée, empreinte, provenance, statut ; propositions/page et validation humaine. |
| property_notes, contacts | Données communes au bien, indépendantes des qualifications par recherche. |
| search_runs, source_runs | Critères figés, statuts, couverture, compteurs et points de reprise. |
| agent_integrations, agent_profiles | Capacités, configuration, références de secrets ; aucune valeur secrète dans les DTO de lecture. |
| tasks, attempts, job_leases | Travail, agent, numéro de tentative, génération/fencing token, échéances et bail. |
| ingestion_receipts, task_events | Déduplication des messages et événements, empreinte, résumé stable des résultats. |
| outbox, scheduled_jobs | Demandes de recalcul/événements externes durablement liées aux transactions. |
| budget_reservations, usage_ledger | Réservé/consommé/estimé/inconnu, période, devise/tarif versionné, opération mère. |
| audit_events, technical_logs | Historique métier durable séparé des diagnostics à rétention configurable. |
| bff_sessions | Session serveur, jetons chiffrés et expiration ; données opérationnelles purgeables. |

UUID pour identifiants opaques ; instants UTC avec fuseau stocké pour la programmation ; dates civiles explicites pour finance. Champs de filtrage et relations en colonnes ; JSONB pour observations brutes utiles, hypothèses/version et preuves structurées. Ne pas stocker les fichiers binaires en JSONB.

Contraintes : clés étrangères, unicité de simulation/rattachement, version concurrente, dates ordonnées, taux bornés, montants non négatifs lorsque métier l'exige. Donnée inconnue = null avec motif/état ; zéro doit rester une valeur connue.

## 4. Résolution des faits et rapprochement

Correction humaine active > observation la plus récente, conformément à Q8/Q54. Garder séparées les estimations d'agent et les observations brutes, et les sélectionner selon le champ (loyer réellement pratiqué versus potentiel, par exemple). Une modification d'hypothèse ne réécrit jamais l'annonce.

**Convention proposée pour l'égalité de dates :** conserver la valeur actuellement sélectionnée, ouvrir un conflit si la valeur diffère, et conserver l'autre observation ; ne pas attribuer arbitrairement une supériorité à un fournisseur. Une date future incohérente est signalée avant sélection.

Identité d'annonce forte : source/référence, puis URL canonique vérifiée dans le périmètre de source. Une URL tronquée ou un identifiant réutilisé peut nécessiter un incident, pas une fusion aveugle. Un nouveau snapshot significatif est créé sur changement de contenu normalisé ; une observation identique actualise la dernière vue sans réécrire l'historique utile.

Entre sources, générer des candidats avec preuves. **Convention conservatrice proposée :** pas de fusion automatique sur seule proximité adresse/surface/prix ; les seuils et preuves d'identité forte doivent être calibrés sur des exemples. La défusion restaure les appartenances par journal d'opération ; notes/corrections sont rattachées selon le choix humain.

Un retrait d'annonce nécessite un signal explicite de retrait/vente/inaccessibilité durable confirmé selon la source. Les erreurs techniques et absences dans une recherche ne changent pas seules la disponibilité. L'actualisation d'une annonce partagée est coalescée entre recherches ; les évaluations restent indépendantes.

## 5. Contrat d'intégration agents

Socle HTTP JSON versionné sous /api/v1/agent ; MCP expose les mêmes cas d'usage si compatible. Aucun adaptateur ne contourne ingestion, autorisation, budget ou clôture.

### 5.1 Capacité déclarée

Chaque intégration déclare : déclenchement automatique, collecte/navigation, documents/vision, retour structuré, progression, annulation, checkpoint/reprise, consommation mesurable et limitations. Enregistrer distinctement capacité annoncée, test réalisé/date et résultat. Une capacité non testée est inconnue ; ne pas proposer l'intégration pour une automatisation nécessitant une garantie non vérifiée.

### 5.2 Mission et résultat

La mission contient taskId, runId si applicable, attemptId, leaseGeneration, criteriaVersionId, type de tâche, périmètre des sources/biens/documents, paramètres figés, échéances, budget et identifiants de corrélation. Les clés API des fournisseurs ne sont jamais incluses dans cette mission publique.

```json
{
  "schemaVersion": "1.0",
  "taskId": "00000000-0000-0000-0000-000000000001",
  "attemptId": "00000000-0000-0000-0000-000000000002",
  "leaseGeneration": 3,
  "batchId": "source-a-page-03",
  "idempotencyKey": "batch-03-v1",
  "sourceCode": "source-a",
  "observedAt": "2026-10-10T08:00:00Z",
  "items": [
    {
      "itemId": "item-01",
      "sourceReference": "ref-123",
      "url": "https://example.org/annonces/ref-123",
      "facts": { "price": null, "surfaceM2": 41, "city": "Tours" },
      "evidence": [{ "kind": "listing", "url": "https://example.org/annonces/ref-123" }]
    }
  ]
}
```

Réponse : receiptId, statut du lot, compteurs created/updated/unchanged/rejected, résultats par itemId et codes de rejet. Les opérations de progression et clôture portent un eventId stable. Une erreur reçoit code, message sûr et correlationId. Une date de réception n'est pas automatiquement une date d'observation.

### 5.3 Enveloppe et validation partielle

- Enveloppe mal formée, version majeure inconnue, références de mission incohérentes : rejeter avant toute écriture métier ; diagnostic technique nettoyé seulement.
- Identité non autorisée : 401/403 ; tentative révoquée : conflit stable, aucun nouvel effet métier.
- Enveloppe valide : valider chaque item indépendamment. Prix/surface absents possibles ; valeurs négatives invalides. Identifiant/URL insuffisants → rejet de l'item avec motif.
- Transaction courte : reçus, éléments acceptés, compteurs, événements métier et outbox de recalcul sont écrits ensemble. Si le commit échoue, aucun de ces effets n'est acquis et aucun accusé de succès n'est renvoyé.
- La requête peut réussir avec tous les items rejetés : résumé explicite, pas « collecte réussie » sans nuance.
- Corriger un item rejeté : nouvel envoi/nouvelle clé, pas réutilisation d'une clé avec un contenu différent.
- Les limites de taille/éléments d'un lot sont configurables et retournées au client ; elles ne sont pas un plafond fonctionnel du nombre total d'annonces.

### 5.4 Idempotence et concurrence

**Convention proposée :** unicité (integrationId, taskId, idempotencyKey), empreinte canonique du contenu et version de contrat. Un champ volatile sans portée métier ne doit pas modifier arbitrairement cette empreinte. La mission/tentative est liée au reçu.

Authentifier et vérifier les droits avant de répondre à un rejeu. Reçu existant et empreinte identique → réponse initiale, sans mutation. Même clé/contenu différent → 409 IdempotencyConflict. Deux envois concurrents sont sérialisés par contrainte unique/transaction ; le perdant lit le reçu confirmé. Un arrêt avant commit permet une reprise ; un arrêt après commit avant accusé permet le rejeu.

Une tentative périmée peut au plus obtenir son propre reçu déjà acquis si son identité reste autorisée ; elle ne peut ajouter un nouvel item, événement ou effet. Les tentatives de secours ont leurs propres reçus ; déduplication métier et identité d'annonce empêchent les nouveaux effets équivalents malgré des clés différentes. Ne pas promettre « exactly once » pour l'appel ou la facturation du fournisseur externe.

**Conservation proposée :** conserver les clés, empreintes et résumés nécessaires à la déduplication tant que les opérations métier existent ; ne pas les supprimer avec les logs à 90 jours. Les payloads de diagnostic peuvent expirer après extraction de leurs preuves métier utiles.

## 6. File PostgreSQL, baux et orchestration

API : enregistrer demande et tâche dans la même transaction, puis répondre rapidement avec identifiant et état. Worker : sélectionner une tâche éligible, réserver la capacité et le budget, créer une tentative et un bail avec génération monotone, valider la transaction, puis appeler l'extérieur. Aucun appel réseau pendant une transaction longue.

Proposition de réservation : lignes verrouillées avec FOR UPDATE SKIP LOCKED ; compteurs de capacité global/intégration atomiques. Le bail a owner, expiresAt et génération. Les callbacks valident en base la génération et l'état autorisé dans leur transaction ; un simple contrôle avant transaction serait insuffisant.

États de tâche proposés : Queued, Running, WaitingForCapacity, WaitingForBudget, WaitingForUser, RetryScheduled, CancelRequested, Succeeded, PartiallySucceeded, Failed, Cancelled. Les états non terminaux réservent l'unicité de l'exécution par recherche ; contraintes et transitions testées. La cause de pause et la couverture collectée sont séparées du statut.

Arrêt/relais : transaction invalidant l'ancienne génération avant activation d'une nouvelle. Demande d'annulation fournisseur si supportée. Après une coupure pendant l'appel de déclenchement externe, l'état peut être inconnu : interroger/réconcilier si possible et réutiliser l'identifiant externe idempotent ; ne pas lancer aveuglément une seconde dépense.

Les résultats acquis restent visibles. La couverture d'une source tient compte des rejets et pages manquantes. Un curseur de reprise appartient à l'intégration qui sait l'interpréter ; transmettre au secours les résultats normalisés et pages connues, jamais supposer son curseur interne compatible.

Une seule tentative supplémentaire d'erreur temporaire par source (Q20), avec compteurs persistants partagés entre tentatives ; ne pas remettre ce quota à zéro lors d'un relais. Les reprises après crash et la liste de secours disposent de plafonds distincts, mais un nombre total de tentatives et un budget de tâche bornent l'ensemble. **Paramètres techniques initiaux proposés :** concurrence globale 2, par intégration 1 ; trois tentatives d'exécution maximum par tâche, reprises incluses. Réviser ces valeurs après dimensionnement, sans changer les règles métier.

Priorité aux tâches manuelles sans préemption. **Proposition :** vieillissement de priorité et réservation périodique d'un créneau aux tâches programmées ; tests de non-famine. Délais adaptés par type/capacité ; une absence de heartbeat non supporté ne doit pas déclencher une fausse panne. Distinguer accusé de déclenchement, première activité et fin.

## 7. Planification et budgets

Planificateur ImmoTrack comme autorité sur les créneaux des recherches. Une intégration événementielle externe reçoit une mission, elle ne crée pas une seconde programmation concurrente. Heure locale Europe/Paris, identifiant de créneau unique et calcul UTC conservé.

**Convention proposée changement d'heure :** heure locale inexistante → premier instant valide après le saut ; heure répétée → une seule exécution sur la première occurrence. À la reprise, coalescer les créneaux échus en un rattrapage. Ne pas rattraper une recherche mise en pause ou archivée.

Budget : réserver atomiquement une estimation majorante bornée avant appel payant, réconcilier avec l'usage réel, rattacher toute tentative au même budget de tâche. Factures tardives, outils payants et devise doivent être pris en compte. **Convention proposée :** mois calendaire Europe/Paris ; tarif et conversion utilisés conservés. Arrêter les nouveaux appels lorsque consommé + réservé atteint le plafond. Une somme « inconnue » ne vaut pas zéro.

Un fournisseur incapable de donner un coût ou une borne ne peut garantir ce plafond. L'administration doit afficher cette capacité manquante avant activation ; les quotas d'un abonnement ChatGPT ne sont pas présentés comme des coûts API mesurés. Les tests de conformité d'intégration tranchent cette capacité. Les montants des plafonds sont une configuration utilisateur encore non renseignée.

## 8. Recalculs et modifications concurrentes

Une modification de recherche incrémente sa version et inscrit les demandes de recalcul dans l'outbox. Le worker coalesce les demandes pour une même simulation vers la génération la plus récente. Chaque évaluation conserve versions des faits sélectionnés, corrections, hypothèses, critères et calculateur.

L'évaluation est enregistrée dans l'historique même si dépassée ; elle ne devient courante que si sa génération correspond encore à la cible. Interface : afficher ancien résultat avec badge obsolète et état du recalcul ; ne pas mélanger valeurs anciennes et nouveaux critères dans le classement courant.

Modification humaine : If-Match/version obligatoire ; 409 ou 412 stable sur conflit, avec valeur actuelle et proposition préservée côté client. Aucun écrasement forcé implicite. Les mises à jour automatiques des observations n'écrasent pas les corrections et ne génèrent pas de conflit sur un champ humain inchangé sans raison.

## 9. Authentification, sessions et secrets

Keycloak local avec MFA ; BFF par Authorization Code, vérification issuer/audience/state/nonce et PKCE. Identité autorisée fondée sur issuer + subject, pas seulement adresse e-mail. Pas d'inscription publique donnant accès automatiquement à l'application.

Cookie de session opaque Secure/HttpOnly/SameSite adapté, session et jetons côté serveur, protection CSRF sur mutations, contrôle Origin et déconnexion/révocation. Persister et protéger les clés de chiffrement des sessions ; restaurer sans réactiver d'anciennes sessions à l'insu de l'utilisateur. React ne lit pas les jetons Keycloak.

Agents : identité distincte par intégration, portée d'action et de tâche vérifiée côté serveur. Selon protocole testé : OAuth machine ou credential dédié révocable. Les identités techniques ne reçoivent pas les droits administrateur de l'humain. Un plugin avec OAuth utilisateur conserve aussi l'identité de l'intégration ; ses outils restent limités au périmètre agent.

Secrets fournisseurs configurables dans l'UI mais lecture masquée : chiffrement applicatif avec clé hors base, version de clé et rotation ; clés de restauration protégées séparément. Logs/export/DTO n'incluent jamais secrets, cookies, jetons ni contenu sensible superflu. Images et documents traités comme entrées non fiables, pas comme instructions administratives.

## 10. Fichiers et atomicité entre systèmes

Stockage S3 privé ; autorisation avant accès et URL signée courte ou flux via API. Contrôler taille/type/empreinte, téléchargement non exécutable, aucune confiance dans le nom fourni. Collecte d'URL : blocage des adresses locales/métadonnées, vérification des redirections et réseau sortant adapté.

Pas de transaction distribuée PostgreSQL/S3 : upload en zone temporaire, validation puis enregistrement de la métadonnée et d'un travail de finalisation. Une pièce ne devient disponible qu'après vérification de son objet. Réconciliation et nettoyage des uploads orphelins ; aucune annonce d'atomicité des fichiers avec les lots JSON.

Copie de photo/plan = provenance, URL/date, empreinte et clé objet immuable. Déduplication physique possible, mais droits et références métier restent distincts. L'analyse IA produit uniquement des suggestions en attente de validation.

## 11. Observabilité, rétention et restauration

Logs structurés avec correlationId/taskId/attemptId/runId/sourceCode, état, code d'erreur et durée. Métriques : attente, tentatives, annonces acceptées/rejetées, couverture, coûts connus/réservés, retard de recalcul, saturation et fraîcheur des sauvegardes. Alertes applicatives uniquement en V1 ; l'interface de supervision du fournisseur reste utile quand ImmoTrack est arrêté.

Rétention technique 90 jours configurable, sans effacer les événements métier nécessaires à la provenance, à l'audit ou à l'idempotence. Séparer audit durable et traces de diagnostic détaillées. Stockage sans expiration métier n'est pas une capacité illimitée : surveiller taille et budget, signaler toute saturation, ne pas purger silencieusement les biens.

Sauvegardes cohérentes : base ImmoTrack, base Keycloak, objets référencés, manifestes, versions d'images/configuration et clés nécessaires. Chiffrement et identifiants externes séparés. Journalières 30 jours, mensuelles 12 mois. Sauvegarde échouée ou ancienne → alerte ; cible RPO 24 h et RTO 24 h non garantie sans exercice.

Après restauration : démarrer en maintenance, invalider baux/tentatives et sessions, rapprocher l'usage externe avant relance, vérifier objets/identité, puis autoriser le rattrapage unique. Un dump de base ne suffit pas à restaurer les documents ou les clés.

## 12. Vérification et livraison

- Tests unitaires du domaine : formules, conformité, score provisoire, disponibilité, priorités et transitions.
- Tests de cas d'usage avec ports simulés : limites, budget, reprise, corrections et autorisations.
- Intégration PostgreSQL réelle : migrations, transactions partielles, conflits concurrents, baux, reçus et génération de calcul.
- Contrats : fixtures versionnées HTTP/MCP, réponses de fournisseurs, inconnu/null/zéro et doublons.
- End-to-end local : Keycloak/MFA/BFF, recherche, résultats progressifs, analyse validée, stop/relais, exports et restauration.
- Tests d'architecture : références interdites vers Infrastructure/ASP.NET/EF depuis Domain/Application.
- CI : compilation, analyse statique .NET, typecheck/lint frontend, tests, migrations sur base vierge et précédente, build images. Pas d'appel IA payant dans la CI par défaut.
- Production : déclenchement manuel d'artefacts testés, maintenance, sauvegarde préalable, migration contrôlée, vérification puis reprise. Une migration destructive nécessite une stratégie de transition et de retour vérifiée.

Les schémas OpenAPI/JSON et migrations SQL complets seront produits dans les tranches d'implémentation, à partir de ce contrat. Ce document n'est pas un schéma exécutable déjà validé contre des fournisseurs.
