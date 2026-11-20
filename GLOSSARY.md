# Atelier

Supervision d'un atelier de production et gestion légère de sa maintenance (GMAO). Les termes sont en anglais, comme dans le code ; l'équivalent français est celui qu'on affiche dans l'UI.

## Atelier

**Machine** (machine) :
Équipement de production supervisé (presse, CNC, convoyeur…), qui appartient à une Line.
_Avoid_ : équipement, asset, poste

**Line** (ligne) :
Libellé qui regroupe des Machines d'un même flux de production. Ce n'est qu'un nom, pas un objet géré à part.
_Avoid_ : îlot, zone

## Télémétrie

**Reading** (relevé) :
Mesure ponctuelle remontée par une Machine : température, vibration, cadence et Status à un instant donné.
_Avoid_ : mesure, point, sample, télémétrie (pour un relevé unique)

**Rate** (cadence) :
Nombre de pièces produites par unité de temps.
_Avoid_ : débit, vitesse

**Status** (statut) :
Ce que la Machine déclare d'elle-même : `running` (en marche), `stopped` (à l'arrêt) ou `fault` (en panne).
_Avoid_ : état (réservé à Health)

**Stop** (arrêt) :
Interruption volontaire de la production (pause, changement de série). Un Stop n'est pas une défaillance.
_Avoid_ : panne, downtime

**Fault** (panne) :
Interruption subie de la production. C'est la seule défaillance qui compte pour la fiabilité.
_Avoid_ : arrêt, incident, défaut

**Health** (santé) :
Niveau que l'atelier déduit pour une Machine à partir de son Status et de ses Open alerts : `ok`, `warning` ou `fault`. C'est la Health qui donne la couleur de la machine, jamais le Status seul.
_Avoid_ : statut, état machine

## Alertes et maintenance

**Threshold** (seuil) :
Limite que la mesure d'une Machine ne doit pas franchir : un maximum pour la température et la vibration, un minimum pour la Rate. Il y a un seul niveau par mesure.
_Avoid_ : limite, consigne

**Alert** (alerte) :
Signal qu'une Machine a franchi un Threshold ou est tombée en Fault. Une Alert couvre tout un épisode (de l'entrée à la sortie de la situation anormale), pas un Reading isolé.
_Avoid_ : alarme, notification, événement

**Open alert** (alerte en cours) :
Alert dont la situation anormale dure encore. Tant qu'une Machine a une Open alert, sa Health n'est pas `ok`.
_Avoid_ : alerte active, alerte non acquittée

**Acknowledge** (acquitter) :
Geste d'un User qui signale qu'il a vu une Alert et qu'elle est prise en charge. Ça ne termine pas l'Alert.
_Avoid_ : valider, fermer, résoudre

**Clear** (retour à la normale) :
Fin d'une Alert, constatée automatiquement quand la mesure repasse du bon côté du Threshold ou que la Machine sort de Fault.
_Avoid_ : résoudre, fermer, acquitter

**WorkOrder** (ordre de maintenance) :
Travail de maintenance à faire sur une seule Machine. Il peut naître d'une Alert ou être créé à la main (préventif).
_Avoid_ : OT, ticket, intervention, tâche

**Assignee** (intervenant) :
User chargé de réaliser un WorkOrder.
_Avoid_ : responsable, owner

## Personnes

**User** (utilisateur) :
Personne qui utilise l'atelier, avec un rôle : `operator` (opérateur), `technician` (technicien) ou `manager` (responsable).
_Avoid_ : compte, employé
