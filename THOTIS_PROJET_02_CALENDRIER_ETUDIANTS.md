# Projet 2: Plateforme de Mise en Relation Étudiants

## Contexte

Thotis souhaite mettre en relation des étudiants actuels (en droit, médecine, etc.) avec des futurs étudiants pour des sessions de questions/réponses.

## Concept

### Vision
Permettre aux lycéens/étudiants en orientation de réserver des créneaux de 15 minutes avec des étudiants actuels pour poser leurs questions sur les filières.

### Concurrent Identifié
**AIDUCA** (A-I-D-U-K-A) - fait déjà ce type de mise en relation avec un simple lien Calendly

### Différenciation Thotis
- Expérience **intégrée** au site Thotis (pas juste un lien externe)
- **Branding** complet Thotis
- Interface optimisée et personnalisée

## Solution Technique Proposée

### Cal.com
**Type:** Open source (licence GNU)
**URL:** cal.com

#### Avantages
- Open source
- API disponible
- Fonctionnalités complètes
- Possibilité de self-hosting (Coolify)

#### Points à Vérifier
- Licence GNU: restrictions commerciales?
- Possibilité de modification du code
- Version community vs SaaS
- Capacités de branding

### Architecture Proposée

```
┌─────────────────────────────────────────┐
│         Site Web Thotis                 │
│  ┌───────────────────────────────────┐  │
│  │  Page Filière (ex: Droit)        │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ Étudiants Disponibles       │ │  │
│  │  │ ┌────┐ ┌────┐ ┌────┐       │ │  │
│  │  │ │Léo │ │Emma│ │Tom │       │ │  │
│  │  │ └────┘ └────┘ └────┘       │ │  │
│  │  └─────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   Cal.com API   │
         └─────────────────┘
                  │
                  ▼
    ┌──────────────────────────┐
    │  Interface Étudiant      │
    │  - Connexion Google Cal  │
    │  - Définir disponibilités│
    │  - Gérer rendez-vous     │
    └──────────────────────────┘
```

## Fonctionnalités

### Côté Étudiant (Mentor)
- Connexion compte Google Calendar
- Définition des plages de disponibilité
- Synchronisation automatique du calendrier
- Gestion des rendez-vous
- Notifications

### Côté Utilisateur (Futur Étudiant)
- Navigation par filière (Droit, Médecine, etc.)
- Visualisation des étudiants disponibles
- Clic sur profil étudiant
- Pop-up calendrier brandé Thotis
- Réservation créneau 15 minutes
- Confirmation par email

### Intégration Site Web
- API Cal.com → Site Thotis
- Design system Thotis
- Expérience fluide et intégrée
- Pas de redirection externe

## Stack Technique

### Option 1: Cal.com Self-Hosted
```yaml
Hébergement: Coolify (infrastructure existante)
Coût: Infrastructure uniquement
Contrôle: Total
Maintenance: À charge
```

### Option 2: Cal.com SaaS + API
```yaml
Hébergement: Cal.com
Coût: Abonnement mensuel
Contrôle: Limité
Maintenance: Cal.com
```

### Recommandation
**Option 1** (Self-hosted) si licence GNU le permet
- Contrôle total du branding
- Coûts optimisés long terme
- Infrastructure déjà en place (Coolify)

## Développement Requis

### Phase 1: Étude de Faisabilité
- [ ] Analyser licence GNU Cal.com
- [ ] Vérifier API disponibles
- [ ] Tester installation Coolify
- [ ] Évaluer capacités de branding

### Phase 2: Backend
- [ ] Installation Cal.com
- [ ] Configuration serveur
- [ ] Intégration Google Calendar
- [ ] API endpoints pour site Thotis

### Phase 3: Frontend
- [ ] Interface étudiant (paramétrage)
- [ ] Intégration site web Thotis
- [ ] Pop-up réservation
- [ ] Design system Thotis

### Phase 4: Tests & Déploiement
- [ ] Tests utilisateurs
- [ ] Tests de charge
- [ ] Documentation
- [ ] Formation équipe Thotis

## Budget Estimé

### Développement
- Étude de faisabilité: 1-2 jours
- Setup infrastructure: 2-3 jours
- Développement backend: 5-7 jours
- Développement frontend: 5-7 jours
- Tests & déploiement: 2-3 jours

**Total:** 15-22 jours de développement

### Coûts Récurrents
- Hébergement: Inclus dans infrastructure existante
- Maintenance: À définir

## Timeline Proposée

```
Semaine 1-2:  Étude faisabilité + Setup
Semaine 3-4:  Développement backend
Semaine 5-6:  Développement frontend
Semaine 7:    Tests & ajustements
Semaine 8:    Déploiement & formation
```

## Risques

### Techniques
- Limitations licence GNU
- Complexité intégration Google Calendar
- Performance Cal.com self-hosted
- Compatibilité API

### Business
- Adoption par les étudiants mentors
- Qualité des échanges
- Modération nécessaire?

## Opportunités

### Court Terme
- Différenciation vs AIDUCA
- Valeur ajoutée pour utilisateurs Thotis
- Engagement communauté étudiante

### Long Terme
- Data sur les questions fréquentes
- Amélioration IA avec insights réels
- Monétisation possible (premium features)

## Prochaines Étapes

1. **Chiffrage détaillé** du projet
2. **Étude licence** Cal.com (GNU)
3. **POC** installation Coolify
4. **Présentation** à Bastien
5. **Validation** budget et timeline

## Statut

- **Phase:** À chiffrer
- **Priorité:** Haute
- **Client:** Très intéressé
- **Deadline:** À définir

## Notes Client

> "Le but, c'est de mettre en relation les étudiants avec les futurs étudiants en droit, ou en médecine, ou autre. Il voudrait faire une connexion API sur son site web."

> "Il aimerait lui avoir une expérience TOTICE beaucoup plus intégrée."
