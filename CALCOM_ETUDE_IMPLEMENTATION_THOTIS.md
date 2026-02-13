# Étude d'Implémentation Cal.com pour Thotis
## Plateforme de Mise en Relation Étudiants

> **⚠️ NOTE HISTORIQUE**: Ce document a été créé avant la suppression complète de la licence commerciale de Cal.com. Les sections mentionnant la "Commercial License" ou "Enterprise Edition" sont conservées à titre informatif uniquement. Cal.com est maintenant entièrement sous licence AGPLv3.

---

## 📋 Table des Matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Analyse de Cal.com](#analyse-de-calcom)
3. [Architecture Technique](#architecture-technique)
4. [Analyse de Licence](#analyse-de-licence)
5. [Customisations Requises](#customisations-requises)
6. [Plan d'Implémentation](#plan-dimplémentation)
7. [Chiffrage Détaillé](#chiffrage-détaillé)
8. [Risques et Mitigation](#risques-et-mitigation)
9. [Recommandations](#recommandations)

---

## 🎯 Résumé Exécutif

### Contexte
Thotis souhaite créer une plateforme de mise en relation entre étudiants actuels (mentors) et futurs étudiants (lycéens en orientation) pour des sessions de questions/réponses de 15 minutes.

### Objectif Business
- **Différenciation vs AIDUCA** (concurrent utilisant Calendly)
- **Expérience intégrée** au site Thotis (pas de redirection externe)
- **Branding complet** Thotis
- **Valeur ajoutée** pour la communauté étudiante

### Solution Proposée
**Cal.com self-hosted** avec customisations pour répondre aux besoins spécifiques de Thotis.

### Budget Estimé
- **Développement:** 18-25 jours (27 000€ - 37 500€ à 1 500€/jour)
- **Infrastructure:** Inclus dans Coolify existant
- **Maintenance:** 2-3 jours/mois (3 000€ - 4 500€/mois)

### Timeline
**8-10 semaines** de la conception au déploiement

---

## 🔍 Analyse de Cal.com

### Vue d'Ensemble

**Cal.com** est une alternative open source à Calendly, conçue pour la prise de rendez-vous en ligne.

#### Caractéristiques Principales
- **Open Source:** Code source disponible sur GitHub
- **Self-hostable:** Déploiement sur infrastructure propre
- **API-driven:** Intégration facile avec systèmes existants
- **White-label:** Personnalisation complète du branding
- **Moderne:** Stack technique récent et performant

### Stack Technique

```yaml
Frontend:
  - Next.js 14+ (React framework)
  - TypeScript
  - Tailwind CSS
  - tRPC (type-safe API)

Backend:
  - Node.js
  - Prisma ORM
  - PostgreSQL
  - tRPC

Intégrations:
  - Google Calendar
  - Zoom, Google Meet
  - Stripe (paiements)
  - Webhooks
```

### Architecture Monorepo

```
cal.com/
├── apps/
│   ├── web/          # Application principale Next.js
│   └── api/          # API v1 & v2
├── packages/
│   ├── prisma/       # Schéma base de données
│   ├── features/     # Fonctionnalités métier
│   ├── ui/           # Composants UI
│   ├── emails/       # Templates emails
│   └── app-store/    # Intégrations tierces
└── docker-compose.yml
```

### Fonctionnalités Natives

#### Pour les Organisateurs (Étudiants Mentors)
- ✅ Connexion calendrier (Google, Outlook, Apple)
- ✅ Définition disponibilités
- ✅ Types d'événements personnalisables
- ✅ Durées configurables (15, 30, 60 min)
- ✅ Notifications email/SMS
- ✅ Gestion des fuseaux horaires
- ✅ Liens de réservation personnalisés

#### Pour les Utilisateurs (Futurs Étudiants)
- ✅ Interface de réservation intuitive
- ✅ Sélection de créneaux disponibles
- ✅ Confirmation par email
- ✅ Ajout au calendrier (ICS)
- ✅ Rappels automatiques
- ✅ Annulation/reprogrammation



---

## 📜 Analyse de Licence

### Type de Licence: AGPLv3

Cal.com est distribué sous **licence AGPLv3** (GNU Affero General Public License v3).

#### Implications Clés

##### ✅ Permissions
- **Utilisation commerciale:** Autorisée
- **Modification du code:** Autorisée
- **Distribution:** Autorisée
- **Usage privé:** Autorisé
- **Self-hosting:** Autorisé

##### ⚠️ Obligations
- **Divulgation du code source:** Si vous modifiez et déployez Cal.com, vous devez rendre le code source modifié accessible aux utilisateurs
- **Même licence:** Les modifications doivent être sous AGPLv3
- **Mention de licence:** Conserver les notices de copyright
- **Accès réseau = distribution:** L'AGPLv3 considère l'accès via réseau comme une distribution

##### 🔒 Restrictions Commerciales

**Important:** Cal.com a une structure de licence hybride:

```
cal.com/
├── packages/features/ee/    # Commercial License (Enterprise)
├── apps/api/v2/src/ee/      # Commercial License (Enterprise)
└── [reste du code]          # AGPLv3
```

Les fonctionnalités **Enterprise Edition (EE)** nécessitent une licence commerciale:
- Teams & Organizations
- SAML SSO
- Workflows avancés
- Certaines intégrations premium

#### Recommandations pour Thotis

##### Option 1: Conformité AGPLv3 (Recommandée)
```yaml
Approche:
  - Utiliser uniquement les fonctionnalités AGPLv3
  - Publier les modifications sur GitHub
  - Ajouter lien "Code Source" dans l'interface
  
Avantages:
  - Gratuit
  - Conforme légalement
  - Contribution à l'open source
  
Inconvénients:
  - Code des customisations public
  - Pas d'accès aux features EE
```

##### Option 2: Licence Commerciale
```yaml
Coût: ~300-500€/mois (à vérifier avec Cal.com)

Avantages:
  - Code privé
  - Support officiel
  - Accès features EE
  - Pas d'obligation de divulgation

Inconvénients:
  - Coût récurrent
  - Dépendance au vendor
```

##### Option 3: Développement Séparé
```yaml
Approche:
  - Cal.com comme backend
  - Interface custom Thotis séparée
  - Communication via API
  
Avantages:
  - Code UI privé
  - Flexibilité maximale
  - Conformité AGPLv3 pour Cal.com
  
Inconvénients:
  - Développement plus long
  - Maintenance de 2 systèmes
```

### Recommandation Finale

**Option 1 (Conformité AGPLv3)** est recommandée pour Thotis:
- Les customisations ne sont pas stratégiques (UI/branding)
- Contribution positive à l'open source
- Coût optimisé
- Conformité légale garantie

---

## 🏗️ Architecture Technique

### Architecture Globale Proposée

```
┌─────────────────────────────────────────────────────────┐
│                    Site Web Thotis                      │
│                  (thotis.com/etudiants)                 │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Page Filière (ex: Droit)                  │ │
│  │                                                   │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Profils Étudiants Disponibles              │ │ │
│  │  │                                             │ │ │
│  │  │  ┌──────┐  ┌──────┐  ┌──────┐            │ │ │
│  │  │  │ Léo  │  │ Emma │  │ Tom  │            │ │ │
│  │  │  │ L3   │  │ M1   │  │ L2   │            │ │ │
│  │  │  │Droit │  │Droit │  │Droit │            │ │ │
│  │  │  └──────┘  └──────┘  └──────┘            │ │ │
│  │  │     ↓          ↓          ↓               │ │ │
│  │  │  [Réserver] [Réserver] [Réserver]        │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ API REST / Embed
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Cal.com Instance Thotis                    │
│           (calendrier.thotis.com)                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │ │
│  │   Next.js    │◄─┤    tRPC      │◄─┤   Database   │ │
│  │  (Custom UI) │  │   Prisma     │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                           │
│         │                  │                           │
│         ▼                  ▼                           │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │  Calendrier  │  │   Webhooks   │                  │
│  │   Google     │  │   Thotis     │                  │
│  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Notifications
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Services Externes                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Email     │  │     SMS      │  │  Analytics   │ │
│  │   SendGrid   │  │   Twilio     │  │   Mixpanel   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Flux Utilisateur

#### 1. Découverte (Site Thotis)
```
Lycéen → Page Filière → Liste Étudiants → Profil Étudiant
```

#### 2. Réservation
```
Clic "Réserver" → Modal Cal.com (iframe/embed) → Sélection créneau → Confirmation
```

#### 3. Confirmation
```
Email confirmation → Ajout calendrier → Rappel J-1 → Rappel H-1
```

### Modes d'Intégration

#### Option A: Embed/iFrame (Recommandée)
```html
<!-- Sur page Thotis -->
<div id="cal-embed">
  <iframe 
    src="https://calendrier.thotis.com/leo-droit?embed=true"
    style="width: 100%; height: 600px; border: 0;"
  />
</div>
```

**Avantages:**
- Implémentation rapide
- Maintenance simplifiée
- Branding Cal.com customisable

**Inconvénients:**
- Moins de contrôle UI
- Iframe peut avoir limitations mobile

#### Option B: API + UI Custom
```typescript
// Frontend Thotis
const bookSlot = async (studentId: string, slot: Date) => {
  const response = await fetch('https://calendrier.thotis.com/api/v2/bookings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      eventTypeId: studentId,
      start: slot.toISOString(),
      responses: { name, email, phone }
    })
  });
  return response.json();
};
```

**Avantages:**
- Contrôle total UI/UX
- Expérience seamless
- Optimisation mobile

**Inconvénients:**
- Développement plus long
- Maintenance complexe
- Dépendance API

#### Option C: Hybride (Recommandée pour MVP)
```yaml
Phase 1 (MVP):
  - Embed Cal.com avec branding Thotis
  - Intégration iframe sur pages filières
  - Webhooks pour synchronisation

Phase 2 (Optimisation):
  - UI custom pour mobile
  - API pour fonctionnalités avancées
  - Analytics détaillés
```



### Infrastructure

#### Hébergement Coolify (Existant)

```yaml
Serveur: Hetzner
Orchestration: Coolify
Stack: Docker Compose

Services:
  cal-web:
    image: calcom/cal.com:latest
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://...
      - NEXTAUTH_SECRET=...
      - NEXT_PUBLIC_WEBAPP_URL=https://calendrier.thotis.com
    
  cal-db:
    image: postgres:15
    volumes: ["cal-data:/var/lib/postgresql/data"]
    
  cal-redis:
    image: redis:7-alpine
```

#### Configuration DNS
```
calendrier.thotis.com → Serveur Coolify
```

#### SSL/HTTPS
- Certificat Let's Encrypt (automatique via Coolify)
- Renouvellement automatique

---

## 🎨 Customisations Requises

### 1. Branding Thotis

#### Interface Utilisateur
```typescript
// packages/ui/theme/thotis.ts
export const thotisTheme = {
  colors: {
    primary: '#FF6B35',      // Orange Thotis
    secondary: '#004E89',    // Bleu Thotis
    accent: '#F7B801',       // Jaune
    background: '#FFFFFF',
    text: '#1A1A1A'
  },
  fonts: {
    heading: 'Montserrat, sans-serif',
    body: 'Inter, sans-serif'
  },
  logo: '/assets/thotis-logo.svg'
};
```

#### Customisation CSS
```css
/* apps/web/styles/thotis-custom.css */
.cal-booking-page {
  --brand-color: #FF6B35;
  --brand-text-color: #FFFFFF;
}

.cal-header {
  background: linear-gradient(135deg, #FF6B35 0%, #004E89 100%);
}

.cal-button-primary {
  background-color: #FF6B35;
  border-radius: 8px;
  font-weight: 600;
}
```

### 2. Profils Étudiants Enrichis

#### Extension du Modèle de Données

```prisma
// packages/prisma/schema.prisma

model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  name        String
  
  // Champs Thotis
  studentProfile StudentProfile?
}

model StudentProfile {
  id              Int      @id @default(autoincrement())
  userId          Int      @unique
  user            User     @relation(fields: [userId], references: [id])
  
  // Informations étudiant
  university      String   // "Université Paris 1 Panthéon-Sorbonne"
  degree          String   // "Licence 3 Droit"
  field           String   // "Droit", "Médecine", "Ingénierie"
  year            Int      // 3
  
  // Profil public
  bio             String   @db.Text
  photoUrl        String?
  linkedinUrl     String?
  
  // Métadonnées
  isActive        Boolean  @default(true)
  totalSessions   Int      @default(0)
  rating          Float?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Interface de Gestion Profil

```typescript
// apps/web/pages/student/profile.tsx
export default function StudentProfilePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1>Mon Profil Étudiant</h1>
      
      <form>
        {/* Photo de profil */}
        <ImageUpload 
          label="Photo de profil"
          value={photoUrl}
          onChange={setPhotoUrl}
        />
        
        {/* Informations académiques */}
        <Select label="Filière" options={fields} />
        <Input label="Université" />
        <Input label="Niveau d'études" />
        
        {/* Bio */}
        <Textarea 
          label="Présentation (visible par les lycéens)"
          maxLength={500}
          placeholder="Parle de ton parcours, tes conseils..."
        />
        
        {/* Disponibilités */}
        <AvailabilitySchedule />
        
        <Button type="submit">Enregistrer</Button>
      </form>
    </div>
  );
}
```

### 3. Filtrage par Filière

#### API Endpoint Custom

```typescript
// apps/api/v2/src/modules/students/students.controller.ts
@Controller('students')
export class StudentsController {
  
  @Get('by-field/:field')
  async getStudentsByField(
    @Param('field') field: string
  ): Promise<StudentProfile[]> {
    return this.studentsService.findByField(field);
  }
  
  @Get(':id/availability')
  async getStudentAvailability(
    @Param('id') id: number,
    @Query('from') from: Date,
    @Query('to') to: Date
  ): Promise<AvailableSlot[]> {
    return this.studentsService.getAvailability(id, from, to);
  }
}
```

#### Widget Sélection Filière

```typescript
// Site Thotis - components/StudentSelector.tsx
export function StudentSelector() {
  const [field, setField] = useState('droit');
  const { data: students } = useQuery(
    ['students', field],
    () => fetch(`/api/students/by-field/${field}`).then(r => r.json())
  );
  
  return (
    <div>
      <FieldTabs 
        fields={['Droit', 'Médecine', 'Ingénierie', 'Commerce']}
        active={field}
        onChange={setField}
      />
      
      <div className="grid grid-cols-3 gap-4">
        {students?.map(student => (
          <StudentCard 
            key={student.id}
            student={student}
            onBook={() => openBookingModal(student)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4. Limitation Durée à 15 Minutes

#### Configuration Type d'Événement

```typescript
// Migration ou seed
const createEventType = async () => {
  await prisma.eventType.create({
    data: {
      title: "Session Orientation",
      slug: "orientation-15min",
      length: 15,              // 15 minutes fixe
      minimumBookingNotice: 60, // 1h de préavis minimum
      
      // Empêcher modification durée
      metadata: {
        lockDuration: true,
        thotisEventType: true
      }
    }
  });
};
```

#### Validation Backend

```typescript
// apps/api/v2/src/modules/bookings/bookings.service.ts
async createBooking(data: CreateBookingDto) {
  const eventType = await this.getEventType(data.eventTypeId);
  
  // Validation Thotis
  if (eventType.metadata?.thotisEventType) {
    if (data.length !== 15) {
      throw new BadRequestException('Les sessions Thotis sont limitées à 15 minutes');
    }
  }
  
  return this.bookingsRepository.create(data);
}
```

### 5. Webhooks Thotis

#### Configuration Webhooks

```typescript
// apps/web/lib/webhooks/thotis.ts
export const thotisWebhooks = {
  
  // Nouvelle réservation
  onBookingCreated: async (booking: Booking) => {
    await fetch('https://api.thotis.com/webhooks/booking-created', {
      method: 'POST',
      headers: { 'X-Webhook-Secret': process.env.THOTIS_WEBHOOK_SECRET },
      body: JSON.stringify({
        bookingId: booking.id,
        studentId: booking.userId,
        attendeeEmail: booking.attendees[0].email,
        startTime: booking.startTime,
        field: booking.metadata.field
      })
    });
  },
  
  // Réservation annulée
  onBookingCancelled: async (booking: Booking) => {
    await fetch('https://api.thotis.com/webhooks/booking-cancelled', {
      method: 'POST',
      headers: { 'X-Webhook-Secret': process.env.THOTIS_WEBHOOK_SECRET },
      body: JSON.stringify({
        bookingId: booking.id,
        reason: booking.cancellationReason
      })
    });
  },
  
  // Session complétée
  onBookingCompleted: async (booking: Booking) => {
    await fetch('https://api.thotis.com/webhooks/booking-completed', {
      method: 'POST',
      headers: { 'X-Webhook-Secret': process.env.THOTIS_WEBHOOK_SECRET },
      body: JSON.stringify({
        bookingId: booking.id,
        studentId: booking.userId,
        duration: booking.length
      })
    });
    
    // Incrémenter compteur sessions étudiant
    await prisma.studentProfile.update({
      where: { userId: booking.userId },
      data: { totalSessions: { increment: 1 } }
    });
  }
};
```

### 6. Emails Personnalisés

#### Templates Email Thotis

```typescript
// packages/emails/templates/thotis-booking-confirmation.tsx
export default function ThotisBookingConfirmation({ 
  studentName, 
  studentField,
  startTime,
  meetingUrl 
}) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Img 
            src="https://thotis.com/logo.png" 
            width="150" 
            alt="Thotis"
          />
          
          <Heading style={h1}>
            Ta session d'orientation est confirmée ! 🎓
          </Heading>
          
          <Text style={text}>
            Tu as réservé une session de 15 minutes avec{' '}
            <strong>{studentName}</strong>, étudiant en {studentField}.
          </Text>
          
          <Section style={infoBox}>
            <Text><strong>📅 Date:</strong> {formatDate(startTime)}</Text>
            <Text><strong>⏰ Heure:</strong> {formatTime(startTime)}</Text>
            <Text><strong>🎓 Filière:</strong> {studentField}</Text>
          </Section>
          
          <Button href={meetingUrl} style={button}>
            Rejoindre la session
          </Button>
          
          <Text style={footer}>
            Des questions ? Contacte-nous à contact@thotis.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

### 7. Analytics & Tracking

#### Événements à Tracker

```typescript
// lib/analytics/thotis-events.ts
export const trackThotisEvent = (event: string, properties: any) => {
  // Mixpanel
  mixpanel.track(event, properties);
  
  // Google Analytics
  gtag('event', event, properties);
};

// Événements
export const ThotisEvents = {
  STUDENT_PROFILE_VIEWED: 'student_profile_viewed',
  BOOKING_STARTED: 'booking_started',
  BOOKING_COMPLETED: 'booking_completed',
  BOOKING_CANCELLED: 'booking_cancelled',
  FIELD_SELECTED: 'field_selected'
};
```



---

## 📅 Plan d'Implémentation

### Phase 1: Étude & Setup (Semaine 1-2)

#### Objectifs
- Valider faisabilité technique
- Configurer environnement de développement
- Définir spécifications détaillées

#### Tâches

**1.1 Analyse Approfondie (2 jours)**
- [ ] Audit complet du code Cal.com
- [ ] Identification des points de customisation
- [ ] Analyse des contraintes de licence
- [ ] Documentation architecture existante

**1.2 Setup Infrastructure (2 jours)**
- [ ] Installation Cal.com sur Coolify (dev)
- [ ] Configuration PostgreSQL
- [ ] Configuration Redis (cache)
- [ ] Tests de performance initiaux

**1.3 Spécifications Détaillées (2 jours)**
- [ ] Wireframes interfaces custom
- [ ] Spécifications API
- [ ] Schéma base de données étendu
- [ ] User stories détaillées

**1.4 Validation Client (1 jour)**
- [ ] Présentation POC
- [ ] Validation design
- [ ] Ajustements spécifications

**Livrables:**
- ✅ Cal.com fonctionnel en dev
- ✅ Spécifications validées
- ✅ Architecture documentée

**Durée:** 7 jours
**Coût:** 10 500€

---

### Phase 2: Développement Backend (Semaine 3-4)

#### Objectifs
- Étendre le modèle de données
- Développer API custom
- Implémenter webhooks

#### Tâches

**2.1 Extension Base de Données (2 jours)**
- [ ] Création modèle `StudentProfile`
- [ ] Migrations Prisma
- [ ] Seeds données de test
- [ ] Tests unitaires modèles

**2.2 API Étudiants (3 jours)**
- [ ] Endpoint `GET /students/by-field/:field`
- [ ] Endpoint `GET /students/:id/availability`
- [ ] Endpoint `POST /students/:id/profile`
- [ ] Endpoint `GET /students/:id/stats`
- [ ] Documentation OpenAPI

**2.3 Webhooks Thotis (2 jours)**
- [ ] Webhook `booking.created`
- [ ] Webhook `booking.cancelled`
- [ ] Webhook `booking.completed`
- [ ] Système de retry
- [ ] Logs et monitoring

**2.4 Logique Métier (2 jours)**
- [ ] Validation durée 15 minutes
- [ ] Calcul disponibilités
- [ ] Gestion conflits calendrier
- [ ] Notifications automatiques

**2.5 Tests Backend (1 jour)**
- [ ] Tests unitaires (Jest)
- [ ] Tests d'intégration
- [ ] Tests API (Postman/Insomnia)

**Livrables:**
- ✅ API fonctionnelle
- ✅ Webhooks opérationnels
- ✅ Tests passants (>80% coverage)

**Durée:** 10 jours
**Coût:** 15 000€

---

### Phase 3: Développement Frontend (Semaine 5-6)

#### Objectifs
- Customiser interface Cal.com
- Développer composants Thotis
- Intégrer branding

#### Tâches

**3.1 Branding & Design System (2 jours)**
- [ ] Thème Thotis (couleurs, fonts)
- [ ] Composants UI custom
- [ ] Logo et assets
- [ ] CSS global

**3.2 Interface Profil Étudiant (3 jours)**
- [ ] Page édition profil
- [ ] Upload photo
- [ ] Gestion disponibilités
- [ ] Prévisualisation profil public

**3.3 Page Réservation Custom (3 jours)**
- [ ] Sélecteur de filière
- [ ] Grille profils étudiants
- [ ] Modal réservation
- [ ] Confirmation booking

**3.4 Intégration Site Thotis (2 jours)**
- [ ] Widget embed Cal.com
- [ ] API client JavaScript
- [ ] Gestion authentification
- [ ] Tests cross-domain

**3.5 Responsive & Mobile (2 jours)**
- [ ] Optimisation mobile
- [ ] Tests multi-navigateurs
- [ ] Performance (Lighthouse)

**Livrables:**
- ✅ Interface brandée Thotis
- ✅ Expérience utilisateur fluide
- ✅ Responsive mobile/desktop

**Durée:** 12 jours
**Coût:** 18 000€

---

### Phase 4: Intégrations (Semaine 7)

#### Objectifs
- Connecter services externes
- Configurer notifications
- Implémenter analytics

#### Tâches

**4.1 Google Calendar (1 jour)**
- [ ] OAuth2 configuration
- [ ] Synchronisation bidirectionnelle
- [ ] Gestion conflits
- [ ] Tests multi-calendriers

**4.2 Emails (1 jour)**
- [ ] Configuration SendGrid/Resend
- [ ] Templates personnalisés
- [ ] Tests envoi
- [ ] Gestion bounces

**4.3 Visioconférence (1 jour)**
- [ ] Intégration Google Meet
- [ ] Génération liens automatiques
- [ ] Tests connexion

**4.4 Analytics (1 jour)**
- [ ] Configuration Mixpanel
- [ ] Événements tracking
- [ ] Dashboards
- [ ] Tests événements

**4.5 Monitoring (1 jour)**
- [ ] Sentry (error tracking)
- [ ] Logs centralisés
- [ ] Alertes
- [ ] Health checks

**Livrables:**
- ✅ Intégrations fonctionnelles
- ✅ Notifications opérationnelles
- ✅ Monitoring actif

**Durée:** 5 jours
**Coût:** 7 500€

---

### Phase 5: Tests & QA (Semaine 8)

#### Objectifs
- Tests end-to-end
- Correction bugs
- Optimisation performance

#### Tâches

**5.1 Tests Fonctionnels (2 jours)**
- [ ] Scénarios utilisateur complets
- [ ] Tests de régression
- [ ] Tests multi-utilisateurs
- [ ] Tests edge cases

**5.2 Tests Performance (1 jour)**
- [ ] Load testing (k6)
- [ ] Optimisation requêtes DB
- [ ] Cache Redis
- [ ] CDN assets

**5.3 Tests Sécurité (1 jour)**
- [ ] Audit OWASP
- [ ] Tests injection SQL
- [ ] Tests XSS/CSRF
- [ ] Validation inputs

**5.4 Corrections Bugs (2 jours)**
- [ ] Priorisation bugs
- [ ] Corrections critiques
- [ ] Corrections mineures
- [ ] Retests

**Livrables:**
- ✅ Application stable
- ✅ Performance optimisée
- ✅ Sécurité validée

**Durée:** 6 jours
**Coût:** 9 000€

---

### Phase 6: Déploiement & Formation (Semaine 9-10)

#### Objectifs
- Déploiement production
- Formation équipe Thotis
- Documentation

#### Tâches

**6.1 Préparation Production (2 jours)**
- [ ] Configuration serveur prod
- [ ] Migration base de données
- [ ] Configuration DNS
- [ ] SSL/HTTPS
- [ ] Backups automatiques

**6.2 Déploiement (1 jour)**
- [ ] Déploiement Cal.com
- [ ] Tests post-déploiement
- [ ] Monitoring actif
- [ ] Rollback plan

**6.3 Documentation (2 jours)**
- [ ] Guide administrateur
- [ ] Guide étudiant mentor
- [ ] Guide utilisateur
- [ ] Documentation technique
- [ ] Runbook ops

**6.4 Formation (2 jours)**
- [ ] Formation équipe Thotis
- [ ] Formation étudiants pilotes
- [ ] Support initial
- [ ] FAQ

**6.5 Lancement Pilote (2 jours)**
- [ ] Onboarding 10 étudiants
- [ ] Tests réels
- [ ] Collecte feedback
- [ ] Ajustements rapides

**Livrables:**
- ✅ Application en production
- ✅ Équipe formée
- ✅ Documentation complète
- ✅ Pilote lancé

**Durée:** 9 jours
**Coût:** 13 500€

---

## 💰 Chiffrage Détaillé

### Développement

| Phase | Durée | Coût (1500€/j) | Description |
|-------|-------|----------------|-------------|
| **Phase 1** | 7 jours | 10 500€ | Étude & Setup |
| **Phase 2** | 10 jours | 15 000€ | Backend |
| **Phase 3** | 12 jours | 18 000€ | Frontend |
| **Phase 4** | 5 jours | 7 500€ | Intégrations |
| **Phase 5** | 6 jours | 9 000€ | Tests & QA |
| **Phase 6** | 9 jours | 13 500€ | Déploiement |
| **TOTAL** | **49 jours** | **73 500€** | |

### Fourchette Réaliste

```yaml
Optimiste (tout se passe bien):
  Durée: 45 jours
  Coût: 67 500€

Réaliste (quelques imprévus):
  Durée: 55 jours
  Coût: 82 500€

Pessimiste (complications):
  Durée: 65 jours
  Coût: 97 500€
```

### Infrastructure

#### Coûts Initiaux
```yaml
Serveur Hetzner (si nouveau):
  - CPX31 (4 vCPU, 8GB RAM): 15€/mois
  - Stockage additionnel 100GB: 5€/mois
  
Domaine:
  - calendrier.thotis.com: Inclus
  
SSL:
  - Let's Encrypt: Gratuit
  
Total initial: ~0€ (infrastructure existante)
```

#### Coûts Récurrents Mensuels
```yaml
Hébergement:
  - Inclus dans Coolify existant: 0€
  
Services Externes:
  - SendGrid (emails): 15€/mois (10k emails)
  - Mixpanel (analytics): 0€ (plan gratuit)
  - Sentry (monitoring): 0€ (plan gratuit)
  
Backups:
  - Hetzner Storage Box: 5€/mois
  
Total mensuel: ~20€/mois
```

### Maintenance

#### Support & Maintenance (Post-Lancement)

```yaml
Maintenance Corrective:
  - Bugs critiques: 0.5 jour/mois
  - Bugs mineurs: 0.5 jour/mois
  - Total: 1 jour/mois = 1 500€/mois

Maintenance Évolutive:
  - Nouvelles features: 1 jour/mois
  - Optimisations: 0.5 jour/mois
  - Total: 1.5 jours/mois = 2 250€/mois

Support Utilisateurs:
  - Formation continue: 0.5 jour/mois
  - Support technique: 0.5 jour/mois
  - Total: 1 jour/mois = 1 500€/mois

Total Maintenance: 4 jours/mois = 6 000€/mois
```

#### Forfait Maintenance Proposé

```yaml
Forfait Light (recommandé année 1):
  - 2 jours/mois
  - Bugs critiques uniquement
  - Support email
  - Coût: 3 000€/mois
  
Forfait Standard:
  - 4 jours/mois
  - Bugs + évolutions mineures
  - Support prioritaire
  - Coût: 5 500€/mois
  
Forfait Premium:
  - 8 jours/mois
  - Développement continu
  - Support 24/7
  - Coût: 10 000€/mois
```

### Coût Total Projet (Année 1)

```yaml
Développement Initial: 82 500€
Infrastructure (12 mois): 240€
Maintenance (12 mois): 36 000€

TOTAL ANNÉE 1: 118 740€
```

### Options de Paiement

#### Option 1: Paiement Échelonné
```
- 30% au démarrage: 24 750€
- 40% à mi-projet: 33 000€
- 30% à la livraison: 24 750€
```

#### Option 2: Paiement par Phase
```
- Phase 1 (Setup): 10 500€
- Phase 2 (Backend): 15 000€
- Phase 3 (Frontend): 18 000€
- Phase 4 (Intégrations): 7 500€
- Phase 5 (Tests): 9 000€
- Phase 6 (Déploiement): 13 500€
- Maintenance: Mensuelle
```



---

## ⚠️ Risques et Mitigation

### Risques Techniques

#### 1. Complexité Customisation Cal.com
**Risque:** Cal.com peut être difficile à customiser profondément
**Impact:** Élevé | **Probabilité:** Moyen

**Mitigation:**
- Phase 1 dédiée à l'analyse approfondie du code
- POC des customisations critiques avant engagement
- Plan B: développement UI séparée avec API Cal.com

#### 2. Performance avec Charge
**Risque:** Dégradation performance avec nombreux utilisateurs
**Impact:** Élevé | **Probabilité:** Faible

**Mitigation:**
- Tests de charge dès Phase 5
- Redis pour cache
- CDN pour assets statiques
- Monitoring proactif (Sentry, logs)
- Scalabilité horizontale possible (Docker)

#### 3. Compatibilité Mises à Jour Cal.com
**Risque:** Customisations cassées par updates Cal.com
**Impact:** Moyen | **Probabilité:** Moyen

**Mitigation:**
- Fork du repo Cal.com
- Versioning strict
- Tests automatisés avant merge updates
- Documentation des customisations
- Stratégie de migration progressive

#### 4. Intégration Google Calendar
**Risque:** Limitations API Google, quotas, authentification
**Impact:** Élevé | **Probabilité:** Faible

**Mitigation:**
- Utiliser OAuth2 officiel
- Gestion des erreurs robuste
- Fallback: calendrier interne Cal.com
- Tests avec comptes Google multiples

### Risques Business

#### 5. Adoption par Étudiants Mentors
**Risque:** Difficulté à recruter étudiants mentors
**Impact:** Critique | **Probabilité:** Moyen

**Mitigation:**
- Programme d'incentives (badges, reconnaissance)
- Onboarding simplifié
- Support dédié étudiants
- Gamification (stats, classements)
- Partenariats avec associations étudiantes

#### 6. Qualité des Sessions
**Risque:** Sessions de mauvaise qualité, étudiants non préparés
**Impact:** Élevé | **Probabilité:** Moyen

**Mitigation:**
- Système de rating/reviews
- Guidelines pour mentors
- Modération a posteriori
- Formation initiale obligatoire
- Possibilité de signalement

#### 7. Concurrence AIDUCA
**Risque:** AIDUCA améliore son offre pendant développement
**Impact:** Moyen | **Probabilité:** Moyen

**Mitigation:**
- Développement rapide (MVP en 8 semaines)
- Différenciation forte (branding, intégration)
- Features exclusives (analytics, matching intelligent)
- Veille concurrentielle continue

### Risques Légaux

#### 8. Conformité RGPD
**Risque:** Non-conformité données personnelles lycéens mineurs
**Impact:** Critique | **Probabilité:** Faible

**Mitigation:**
- Consentement parental si <15 ans
- Politique de confidentialité claire
- Droit à l'oubli implémenté
- Chiffrement données sensibles
- Audit RGPD avant lancement

#### 9. Licence AGPLv3
**Risque:** Non-respect obligations open source
**Impact:** Élevé | **Probabilité:** Faible

**Mitigation:**
- Publication code sur GitHub
- Lien "Code Source" dans interface
- Documentation licence claire
- Consultation juridique si doute

### Risques Opérationnels

#### 10. Disponibilité Service
**Risque:** Downtime pendant sessions importantes
**Impact:** Élevé | **Probabilité:** Faible

**Mitigation:**
- Monitoring 24/7 (UptimeRobot)
- Alertes automatiques
- Backups quotidiens
- Plan de reprise d'activité (PRA)
- SLA 99.5% minimum

#### 11. Dépendance Équipe Développement
**Risque:** Départ développeur clé
**Impact:** Moyen | **Probabilité:** Moyen

**Mitigation:**
- Documentation exhaustive
- Code review systématique
- Knowledge sharing
- Binômage sur features critiques
- Accès code source (GitHub)

### Matrice des Risques

```
Impact vs Probabilité

Critique │ 5,8
         │
Élevé    │ 1,2,6    4
         │
Moyen    │ 3,7,11   
         │
Faible   │          9,10
         │
         └─────────────────────
           Faible  Moyen  Élevé
              Probabilité
```

### Plan de Contingence

#### Si Customisation Cal.com Trop Complexe
```yaml
Plan B:
  - Utiliser Cal.com vanilla en backend
  - Développer UI custom complète en frontend
  - Communication via API Cal.com v2
  
Impact:
  - +2 semaines développement
  - +10 000€ coût
  - Meilleur contrôle UX
```

#### Si Performance Insuffisante
```yaml
Plan B:
  - Migration vers serveur plus puissant
  - Optimisation base de données (indexes)
  - Mise en cache agressive (Redis)
  - CDN pour assets
  
Impact:
  - +50€/mois infrastructure
  - +1 semaine optimisation
```

---

## 🎯 Recommandations

### Stratégie de Lancement

#### Phase Pilote (Mois 1-2)
```yaml
Objectif: Valider concept avec utilisateurs réels

Périmètre:
  - 1 filière (Droit)
  - 10 étudiants mentors
  - 50 lycéens max
  
Métriques:
  - Taux de réservation
  - Satisfaction (NPS)
  - Taux de complétion sessions
  - Feedback qualitatif
  
Critères de succès:
  - NPS > 40
  - Taux complétion > 80%
  - 0 bugs critiques
```

#### Déploiement Progressif (Mois 3-6)
```yaml
Mois 3: +2 filières (Médecine, Ingénierie)
Mois 4: +30 étudiants mentors
Mois 5: Ouverture tous lycéens
Mois 6: Toutes filières disponibles
```

### Fonctionnalités Futures (Roadmap)

#### V1.1 (3 mois post-lancement)
- [ ] Système de reviews/ratings
- [ ] Matching intelligent (IA)
- [ ] Statistiques pour étudiants
- [ ] Badges et gamification

#### V1.2 (6 mois)
- [ ] Sessions de groupe (3-5 lycéens)
- [ ] Enregistrement sessions (avec consentement)
- [ ] Chatbot pré-session
- [ ] Recommandations personnalisées

#### V2.0 (12 mois)
- [ ] Marketplace (sessions payantes premium)
- [ ] Programme de mentorat long terme
- [ ] Intégration Parcoursup
- [ ] Mobile app (React Native)

### Optimisations Techniques

#### Court Terme
```yaml
Performance:
  - Lazy loading composants
  - Image optimization (WebP)
  - Code splitting
  - Service Worker (PWA)

SEO:
  - Meta tags dynamiques
  - Sitemap XML
  - Schema.org markup
  - Open Graph
```

#### Moyen Terme
```yaml
Scalabilité:
  - Migration vers Kubernetes
  - Load balancing
  - Database replication
  - Microservices (si nécessaire)

Monitoring:
  - APM (Application Performance Monitoring)
  - Real User Monitoring (RUM)
  - Error tracking avancé
  - Business metrics dashboard
```

### Indicateurs de Succès (KPIs)

#### Métriques Techniques
```yaml
Performance:
  - Time to First Byte < 200ms
  - First Contentful Paint < 1s
  - Lighthouse Score > 90
  - Uptime > 99.5%

Qualité:
  - Code coverage > 80%
  - 0 bugs critiques
  - Temps résolution bugs < 24h
```

#### Métriques Business
```yaml
Adoption:
  - 100 étudiants mentors (6 mois)
  - 1000 sessions/mois (6 mois)
  - 50% lycéens reviennent

Satisfaction:
  - NPS > 50
  - Rating moyen > 4.5/5
  - Taux complétion > 85%

Engagement:
  - Temps moyen session: 15 min
  - Taux annulation < 10%
  - Taux no-show < 5%
```

### Comparaison avec Alternatives

#### Cal.com vs Calendly vs Développement Custom

| Critère | Cal.com | Calendly | Custom |
|---------|---------|----------|--------|
| **Coût initial** | 82 500€ | 0€ | 150 000€+ |
| **Coût mensuel** | 20€ | 96€/user | 500€+ |
| **Customisation** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Time to market** | 8-10 sem | 1 sem | 6+ mois |
| **Maintenance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Scalabilité** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Branding** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Contrôle données** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

**Recommandation:** Cal.com offre le meilleur compromis coût/fonctionnalités/contrôle pour Thotis.

### Facteurs de Décision

#### Choisir Cal.com si:
- ✅ Budget limité (< 100k€)
- ✅ Time to market important (< 3 mois)
- ✅ Besoin de contrôle données
- ✅ Équipe technique compétente
- ✅ Volonté de contribuer open source

#### Choisir Calendly si:
- ✅ Besoin immédiat (< 1 semaine)
- ✅ Pas de ressources dev
- ✅ Branding secondaire
- ✅ Budget récurrent acceptable

#### Choisir Développement Custom si:
- ✅ Budget conséquent (> 150k€)
- ✅ Besoins très spécifiques
- ✅ Différenciation critique
- ✅ Équipe dev interne
- ✅ Vision long terme (5+ ans)

---

## 📊 Analyse ROI

### Investissement

```yaml
Année 1:
  Développement: 82 500€
  Infrastructure: 240€
  Maintenance: 36 000€
  Total: 118 740€

Année 2-3:
  Maintenance: 36 000€/an
  Infrastructure: 240€/an
  Total: 36 240€/an
```

### Revenus Potentiels

#### Modèle Freemium
```yaml
Sessions Gratuites:
  - 80% des sessions
  - Acquisition utilisateurs
  - Données pour IA

Sessions Premium (5€):
  - 20% des sessions
  - Étudiants expérimentés
  - Durée 30 minutes
  
Projections (Mois 12):
  - 2000 sessions/mois
  - 400 sessions premium
  - Revenu: 2 000€/mois
  - Revenu annuel: 24 000€
```

#### Modèle B2B (Lycées)
```yaml
Abonnement Lycée:
  - 500€/mois par lycée
  - Accès illimité élèves
  - Dashboard analytics
  - Support dédié
  
Projections (Mois 18):
  - 10 lycées partenaires
  - Revenu: 5 000€/mois
  - Revenu annuel: 60 000€
```

#### Modèle Data/Insights
```yaml
Rapports Orientation:
  - Vente insights anonymisés
  - Tendances filières
  - Données pour EdTech
  
Projections (Mois 24):
  - 5 clients B2B
  - 1 000€/mois par client
  - Revenu annuel: 60 000€
```

### Break-Even Analysis

```yaml
Scénario Conservateur:
  Année 1: -118 740€
  Année 2: -36 240€ + 24 000€ = -12 240€
  Année 3: -36 240€ + 84 000€ = +47 760€
  
  Break-even: Mois 30

Scénario Optimiste:
  Année 1: -118 740€
  Année 2: -36 240€ + 60 000€ = +23 760€
  Année 3: -36 240€ + 144 000€ = +107 760€
  
  Break-even: Mois 20
```

### Valeur Stratégique

Au-delà du ROI financier direct:

```yaml
Différenciation:
  - Avantage concurrentiel vs AIDUCA
  - Expérience utilisateur supérieure
  - Branding Thotis renforcé

Données:
  - Insights sur besoins orientation
  - Amélioration IA conversationnelle
  - Personnalisation recommandations

Communauté:
  - Engagement étudiants
  - Réseau alumni
  - User-generated content

Valeur estimée: 200 000€+ sur 3 ans
```

---

## 📝 Conclusion

### Synthèse

Cal.com représente une **solution optimale** pour Thotis:

✅ **Techniquement viable:** Stack moderne, architecture solide
✅ **Économiquement rentable:** Coût maîtrisé vs alternatives
✅ **Légalement conforme:** AGPLv3 compatible avec usage commercial
✅ **Stratégiquement pertinent:** Différenciation vs concurrence

### Prochaines Étapes

#### Immédiat (Semaine 1)
1. **Validation budget** avec Bastien
2. **Signature contrat** développement
3. **Kick-off meeting** équipe technique

#### Court Terme (Mois 1)
1. **Phase 1:** Étude & Setup
2. **Recrutement** 10 étudiants pilotes
3. **Définition** KPIs détaillés

#### Moyen Terme (Mois 2-3)
1. **Développement** complet
2. **Tests** avec utilisateurs réels
3. **Lancement pilote** filière Droit

### Facteurs Clés de Succès

```yaml
Technique:
  - Équipe dev expérimentée
  - Architecture scalable
  - Monitoring proactif

Business:
  - Adoption étudiants mentors
  - Qualité des sessions
  - Marketing efficace

Opérationnel:
  - Support réactif
  - Formation continue
  - Amélioration continue
```

### Engagement

Nous nous engageons à:
- ✅ Livrer une solution fonctionnelle en 8-10 semaines
- ✅ Respecter le budget de 82 500€ (±10%)
- ✅ Assurer une disponibilité > 99.5%
- ✅ Former l'équipe Thotis
- ✅ Fournir documentation complète
- ✅ Support 3 mois post-lancement inclus

---

## 📞 Contact

Pour toute question sur cette étude:

**Email:** contact@thotis.com  
**Téléphone:** +33 X XX XX XX XX

**Validité de l'offre:** 30 jours

---

*Document généré le 4 février 2026*  
*Version 1.0*
