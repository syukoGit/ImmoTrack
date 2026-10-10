# ImmoTrack V1 — Calculs et cas de référence

10 octobre 2026 — formalisation des décisions financières Q21–44, Q72–80, Q89–99 et Q128–144.

## 1. Statut des conventions

Les choix de l'entretien sont repris sans changement. Les détails ci-dessous explicitement marqués **convention proposée** rendent les formules exécutables ; ils n'ont pas fait l'objet d'une question distincte. Leur recette sur exemples précède l'implémentation définitive. Les seuils 3 %/8 % de Q139 restent des exemples et ne deviennent pas des paramètres utilisateur par défaut.

Le calculateur est une bibliothèque .NET pure : aucune IA, I/O, horloge implicite ou base de données. Il reçoit un instantané complet, retourne métriques, inconnus, hypothèses, avertissements et version. Montants en EUR ; taux transmis avec leur unité, jamais sous forme ambiguë « 2 » pour 2 % ou 200 %.

**Convention proposée :** decimal .NET et NUMERIC PostgreSQL ; arrondi monétaire au centime, à mi-distance en s'éloignant de zéro. Calculs intermédiaires non arrondis sauf échéancier monétaire ; ajuster la dernière échéance au capital restant. Score affiché à une décimale, rendements à deux décimales ; tri sur valeurs non arrondies et départage déterministe. Aucune division par zéro : résultat non calculable et motif.

## 2. Coût total, prix et financement

Notations : P prix d'achat retenu pour la simulation ; H honoraires d'agence à ajouter seulement s'ils ne sont pas déjà compris ; F frais d'acquisition ; W travaux initiaux ; M mobilier ; B frais initiaux de financement.

```text
C = P + H + F + W + M + B
F = montant exact saisi, sinon taux configuré × P
```

Le prix affiché et le prix négocié envisagé sont deux valeurs distinctes ; la seconde, lorsqu'elle est utilisée, reste une hypothèse. La réserve n'entre ni dans C ni dans l'apport du projet. Les intérêts futurs et assurances périodiques n'entrent pas dans C. Les travaux initiaux ne sont pas de nouveau déduits du revenu annuel net.

Modes : apport A fixé → crédit L = C − A ; crédit L fixé → apport A = C − L ; comptant → L = 0 et A = C. Aucune somme négative calculée silencieusement : entrée incohérente à corriger. **Convention proposée :** allocation de financement globale, pas de simulation de l'éligibilité bancaire de chaque poste. Les frais de financement sont saisis en montant pour éviter une boucle frais proportionnels/crédit ; une éventuelle formule supplémentaire doit être documentée.

## 3. Crédit et assurance

N : durée totale en mois ; d : différé de capital ; n = N − d ; i : taux annuel nominal / 12. Crédit positif : N > 0, 0 ≤ d < N. Taux négatif non pris en charge par cette convention V1. Comptant : aucun échéancier ni assurance emprunteur.

```text
Mensualité hors assurance = L × i / (1 − (1 + i)^(-n)), si i > 0
Mensualité hors assurance = L / n, si i = 0
Pendant le différé : intérêts = L × i ; remboursement de capital = 0
```

Tous les fonds sont débloqués à l'acquisition. Pendant le différé, intérêts et assurance sont payés, sans capitalisation. **Convention proposée :** hors différé, intérêts calculés sur le capital au début du mois ; capital remboursé = mensualité − intérêts. Assurance annuelle a sur capital initial : L × a / 12 ; sur capital restant dû : capital au début du mois × a / 12.

Pour le cash-flow stabilisé, retenir les douze premiers mois normaux d'amortissement après différé, assurance comprise ; afficher cette référence indépendamment du calendrier de stabilisation physique. **Cas limite proposé :** si l'amortissement réel dure moins de douze mois, n'ajouter aucune échéance après remboursement et signaler que la référence comprend une extinction anticipée du crédit ; recette explicite requise.

## 4. Revenus longue durée

Lot loué : loyer réellement pratiqué ; lot vacant : loyer estimé documenté ou hypothèse manuelle. Séparer loyer hors charges et remboursements de charges. Les loyers potentiels ne sont pas ajoutés aux loyers pratiqués.

Avec r loyer mensuel hors charges, v semaines de vacance/an et p taux d'impayés :

```text
R_annuel = 12 × r × (1 − v / 52) × (1 − p)
```

**Convention proposée :** 52 semaines normatives, v borné à [0,52], p à [0,1]. En projection, multiplier r × (1 − v/52) × (1 − p) par la fraction disponible de chaque mois. Le délai initial annule cette fraction ; ne pas y ajouter une deuxième perte de vacance. Une année entière d'exploitation utilise douze mois normatifs. Aucun prorata ne doit compter un mois avant la date de disponibilité.

Calendrier de recette V1 proposé : périodes mensuelles, date d'acquisition et dates de disponibilité explicites ; fraction = jours disponibles / jours du mois pour un mois civil partiel. Le traitement mensuel des dépenses récurrentes et des échéances suit leurs dates convenues. L'année stabilisée ignore les retards initiaux mais conserve vacance et impayés.

Les postes inconnus restent inconnus. Charges, taxe ou travaux peuvent utiliser une hypothèse configurée clairement affichée ; aucun loyer inconnu n'est inventé par un barème automatique. Un montant saisi à zéro reste une assertion explicite, pas une absence.

### Revenu global d'immeuble

Conserver montant, période, nature (hors charges/charges comprises, brut ou déjà net de vacance) et provenance. Sans nature connue, les indicateurs nécessitant cette ventilation sont indisponibles ou demandent une hypothèse explicite. Ne jamais appliquer à nouveau une vacance déjà incluse dans le montant.

Le global reste seul utilisé tant que le détail est incomplet. Ne pas fabriquer de résidu par lot. Un détail complet égal au global peut remplacer le global ; tout écart doit être confirmé manuellement. **Convention proposée :** égalité après normalisation annuelle au centime. Sans calendrier de revenu global suffisamment décrit, la projection détaillée peut rester non calculable alors que des indicateurs annuels restent disponibles.

## 5. Saisonnier et immeubles mixtes

Par mois m : jours disponibles Dm, occupation om dans [0,1], prix de nuitée qm et durée moyenne de séjour sm > 0.

```text
Nuits attendues = Dm × om
Séjours attendus = Nuits attendues / sm
Recettes nuitées = Nuits attendues × qm
```

**Convention proposée :** des séjours attendus fractionnaires sont admis pour une prévision, sans arrondi au séjour entier. Frais voyageurs = séjours attendus × frais facturés par séjour. Dépenses ménage/linge = séjours attendus × coût supporté par séjour. Comptabiliser recettes voyageurs et dépenses une fois chacune ; ne pas supposer qu'elles s'annulent.

Les commissions possèdent une assiette explicite : nuitées seules ou nuitées et frais voyageurs ; pas de double application. Concierge, consommables et charges fixes sont des postes distincts. Une taxe encaissée pour être reversée ne constitue pas un revenu d'exploitation ; le modèle ne réalise pas d'analyse fiscale.

L'occupation saisonnière comprend déjà les nuits non louées ; ne pas lui ajouter la vacance longue durée. **Convention proposée :** impayés longue durée inapplicables au saisonnier par défaut ; d'autres pertes demandent un poste explicite. L'année stabilisée saisonnière utilise douze mois avec jours et saisonnalité conservés. **Convention proposée :** année civile de référence non bissextile fixée dans les entrées, pas année courante implicite.

Sommer les résultats par usage pour un immeuble mixte, puis retrancher une seule fois les charges communes. Critères touristiques uniquement pour lots saisonniers. Pas de classement mélangé avec les projets entièrement saisonniers.

### Preuves des estimations

- Longue durée (Q143) : au moins trois biens distincts, références de moins de six mois, sources consultables, loyers demandés/pratiqués identifiés et différences expliquées.
- Nuitées : **convention proposée**, reprenant la proposition discutée en Q144 : au moins trois hébergements comparables, période, type de logement et frais documentés. Leur grille de prix doit couvrir ou justifier les mois estimés. Le choix explicite Q144 portait sur l'autorisation des calendriers, pas sur un seuil numérique de prix définitivement validé.
- Occupation (Q144) : statistiques/réservations sourcées ou inférence depuis calendriers publics. Dans ce dernier cas, indisponibilité observée et occupation estimée sont distinctes ; documenter horizon d'observation, biais, transformation et incertitude. Pas de règle universelle « indisponible = loué ».
- Sans preuve ou hypothèse manuelle explicite : valeur inconnue et indicateur dépendant indisponible. Un état provisoire ne dispense pas de provenance.

## 6. Charges et indicateurs

E : recettes annuelles d'exploitation après vacance/impayés, y compris prestations voyageurs conservées par le propriétaire. X : dépenses annuelles d'exploitation supportées. RN = E − X.

```text
Rendement net sur coût total = 100 × RN / C
Rendement net sur prix = 100 × RN / P
Cash-flow stabilisé annuel = RN − échéances annuelles − assurance emprunteur annuelle
Cash-flow stabilisé mensuel = Cash-flow stabilisé annuel / 12
Effort d'épargne mensuel = max(0, −Cash-flow mensuel)
```

Charges récupérables : traiter les encaissements et dépenses en cohérence ; ne pas déduire à la fois charge complète et part non récupérable. Taxe foncière nette de la part récupérée, assurances du bien, gestion, entretien et charges spécifiques sont dans X. La réserve travaux initiale est au coût d'investissement ; l'entretien courant est une charge distincte.

**Convention proposée pour le rendement brut :** recettes locatives avant charges et impayés ; longue durée avant vacance structurelle, saisonnier avec occupation prévue (pas 100 % fictif), hors remboursements de charges et prestations refacturées. Afficher cette différence de nature ; la référence de classement reste le rendement net sur coût total, et les stratégies sont séparées.

Prix au m² : préciser le dénominateur de surface. Ne pas mélanger surface habitable et surfaces commerciales/annexes sans libellé distinct. Surface absente ou nulle → indicateur indisponible.

## 7. Trésorerie et réserve

Inclure un instant initial d'acquisition (mois 0) et les mois d'exploitation. Les entrées comportent apport et crédit une seule fois, puis recettes. Les sorties comprennent achat/frais, travaux/mobilier selon calendrier, charges, crédit et assurance. Les fonds travaux débloqués mais non dépensés restent dans le solde jusqu'à paiement.

```text
Solde_cumulé(m) = somme des entrées jusqu'à m − somme des sorties jusqu'à m
Réserve_nécessaire = max(0, −minimum des soldes cumulés)
Réserve_manquante = max(0, Réserve_nécessaire − Réserve_disponible)
```

Calculer ce besoin avant d'ajouter la réserve disponible dans les entrées. L'horizon couvre au moins 12 mois et jusqu'à disponibilité de tous les lots/fin des travaux, limité à 36 mois. La réserve est donc un besoin **sur cet horizon** ; ne pas promettre la solvabilité au-delà. Un cash-flow durablement négatif est affiché séparément.

## 8. Scénario dégradé

Appliquer cumulativement les écarts de Q136 aux entrées centrales, puis recalculer. Prix d'achat, crédit et échéancier inchangés. Travaux ×1,15 ; loyer ×0,90 ; vacance +2 semaines bornée à 52 ; nuitée ×0,90 ; occupation −0,10 bornée à zéro ; dépenses d'exploitation ×1,10 après recalcul de leurs assiettes variables.

Les hausses de travaux augmentent le coût total du dégradé et les sorties de trésorerie. **Convention proposée :** conserver l'apport initial central dans la projection du dégradé ; le complément apparaît dans la réserve nécessaire, sans double financement par un nouvel apport et par la réserve. Afficher séparément le besoin total de fonds personnels. Pas de variation automatique du taux d'impayés, de la durée des travaux ou du taux du crédit, non retenue dans le profil par défaut.

## 9. Score

Pour une dimension financière x avec niveau bas b et cible c > b :

```text
note(x) = min(100, max(0, 100 × (x − b) / (c − b)))
```

Poids initiaux rendement/cash-flow/demande : 0,40 / 0,40 / 0,20. **Convention proposée :** somme des poids = 100 %, pas de poids négatif, au moins un poids positif ; formulaire empêchant une configuration invalide. Repères absents ou égaux/inversés : configuration incomplète ou invalide, pas un score silencieusement calculé.

Demande : 0/25/50/75/100 selon une rubrique locative ou touristique versionnée. Le modèle propose un niveau justifié ; ImmoTrack mappe le niveau vers une note. **Proposition de rubrique à calibrer :** qualifier plusieurs signaux indépendants (tension/délais et attracteurs/stock pour le locatif ; fréquentation, saisonnalité et offre concurrente pour le touristique). Des signaux contradictoires doivent être exposés. Sans éléments suffisants, inconnu ; la spécification d'une grille mesurable par source reste un livrable de calibration, pas une vérité de marché fournie par le LLM.

**Agrégation mixte proposée à valider sur exemples :** calculer une demande par usage concerné, puis moyenne pondérée par sa part des revenus stabilisés ; si ces poids ou une demande indispensable sont inconnus, dimension globale inconnue. Ne pas appliquer arbitrairement une moyenne de surfaces entre logement, commerce et parking. Cette agrégation n'a pas été choisie explicitement pendant l'entretien.

```text
Si toutes les dimensions de poids positif sont inconnues : score non calculable
Sinon note_utilisée = note connue, ou 50 si inconnue
Score = somme(poids × note_utilisée)
Part_documentée = somme(poids des dimensions connues) × 100
```

Une seule dimension active manquante → badge provisoire. La complétude pondérée du score ne remplace pas l'indicateur de complétude de toute la fiche. Un score entièrement calculable à partir d'estimations documentées n'est pas une garantie d'exactitude ; les badges d'estimation/incertitude restent visibles. Les scores provisoires sont classés avec les complets, sans lever les critères éliminatoires inconnus.

## 10. Cas chiffrés de recette

Les exemples sont des jeux de test, pas des hypothèses par défaut.

| Cas | Entrées | Résultat attendu |
| --- | --- | --- |
| F01 Comptant | C=120 000 €, P=100 000 €, loyers 9 600 €/an, charges 2 400 €, vacance/impayés=0 | RN=7 200 €, net coût=6 %, net prix=7,2 %, cash-flow=600 €/mois. |
| F02 Taux nul | F01, L=100 000 €, N=240, d=0, assurance capital initial 0,24 %/an | Mensualité théorique 416,666… €, assurance 20 €, cash-flow théorique 163,333… €/mois ; affichage 163,33 €. Échéancier ajusté au centime à la fin. |
| F03 Différé | L=120 000 €, N=240 dont d=12, taux=0, assurance=0 | Différé : capital remboursé=0 ; ensuite 228 mensualités théoriques de 526,315789… €. Durée totale 240 mois. |
| F04 Vacance et impayés | r=1 000 €, v=4 semaines, p=2 % | Revenus annuels = 12 000 ×48/52 ×0,98 = 10 855,384615… €, soit 10 855,38 €. |
| F05 Inconnu | Loyer absent et aucune estimation documentée/hypothèse manuelle | Rendement et cash-flow non calculables ; aucune substitution à zéro. |
| F06 Global incomplet | Global 24 000 €/an, un lot renseigné à 9 600 €/an | Référence 24 000 €, provisoire ; jamais 33 600 €. |
| F07 Global divergent | Global 24 000 €, détail complet 25 200 € | Garder 24 000 € jusqu'à validation ; signaler +1 200 €. |
| F08 Réserve | Soldes cumulés avant réserve : 2 000 €, −3 000 €, −8 000 €, −6 000 € ; réserve disponible 5 000 € | Besoin 8 000 €, manque 3 000 €. |
| F09 Score provisoire | Notes 75 / 50 / inconnue ; poids 40/40/20 | Score 60/100, provisoire, part documentée 80 %. Aucun revenu fabriqué. |
| F10 Score vide | Trois dimensions actives inconnues | Non calculable, pas 50/100. |
| F11 Score linéaire | b=3 %, c=8 %, x=5,5 % | Note rendement=50. x=10 % donne 100 ; x=2 % donne 0. |
| F12 Saison et frais | 30 jours, occupation 60 %, nuitée 100 €, séjour 3 nuits, ménage facturé 40 €/séjour, coût 35 €/séjour, commission 10 % sur nuitées seules | 18 nuits, 6 séjours, recettes 2 040 €, ménage 210 €, commission 180 €, net avant autres charges 1 650 €. |
| F13 Dégradé | Loyer 1 000 €, vacance 4 sem., nuitée 100 €, occupation 70 %, charge fixe 100 €, travaux 20 000 € | 900 €, 6 sem., 90 €, 60 %, 110 €, 23 000 € ; même crédit. |
| F14 Travaux longs | Dernière mise en location prévue au mois 40 | Projection limitée à 36 mois, alerte visible ; année stabilisée théorique distinguée de l'horizon couvert. |
| F15 Immeuble mixte | Mois type : lot longue durée 1 000 € de loyer, 100 € de charges ; lot saisonnier de F12 ; charges communes 150 €, sans autre charge ni crédit | Net mensuel = 1 000 −100 +1 650 −150 = 2 400 €. Chaque poste commun compté une fois, revenus séparés par usage ; catégorie saisonnier mixte. |
| F16 Assurance restant dû | L=12 000 €, taux crédit=0, N=12, assurance annuelle 1,2 % sur capital de début de mois | Capital de référence : 12 000, 11 000, …, 1 000 € ; assurances 12, 11, …, 1 €, total 78 €. Sur capital initial, total 144 €. |
| F17 Différé à taux positif | L=120 000 €, taux annuel nominal 3 %, d=12, assurance capital initial 0,24 % | Pendant le différé : intérêts 300 €/mois, assurance 24 €, total 324 €, capital restant 120 000 €. |
| F18 Travaux déjà financés | C=120 000 €, apport=20 000 €, crédit=100 000 € ; sortie acquisition/frais=100 000 € au mois 0, travaux=20 000 € au mois 1 ; autres flux=0 pour isoler le cas | Solde initial 20 000 €, puis 0 €. Besoin de réserve=0 €, pas 20 000 €. |

Cas de recette additionnels obligatoires : frais d'agence inclus/exclus ; mois partiel ; occupation 0/100 % ; lot loué avec potentiel distinct ; corrections prioritaires ; ancienne évaluation terminant après une nouvelle génération.

## 11. Paramètres à configurer, sans nouvelle décision d'architecture

Repères financiers bas/cible, hypothèses de charges/travaux/taxe, taux/durée/assurance, réserve, calendrier et profils d'actualisation doivent être saisis ou confirmés dans la recherche. Aucune valeur implicite « réaliste » ne remplace une préférence utilisateur inconnue. La grille probatoire et l'agrégation mixte proposées doivent être finalisées avant recette du scoring sur ces usages.
