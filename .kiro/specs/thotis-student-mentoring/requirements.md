# Requirements Document: Thotis Student Mentoring Platform

## Introduction

The Thotis Student Mentoring Platform is a customized Cal.com-based solution that connects current university students (mentors) with prospective students (high school students) for 15-minute Q&A sessions. The platform will be self-hosted, fully branded with Thotis identity, and integrated seamlessly into the Thotis website to provide a differentiated experience compared to competitors using simple Calendly links.

## Glossary

- **Student_Mentor**: A current university student who offers mentoring sessions to prospective students
- **Prospective_Student**: A high school student seeking guidance about university programs
- **Session**: A 15-minute video call between a Student_Mentor and a Prospective_Student
- **Thotis_Platform**: The main Thotis website that integrates the mentoring functionality
- **Cal_System**: The customized Cal.com backend system
- **Booking_Widget**: The embedded interface for booking sessions
- **Field**: An academic domain (Law, Medicine, Engineering, etc.)
- **Availability_Schedule**: Time slots when a Student_Mentor is available for sessions
- **Profile**: Public information about a Student_Mentor including university, degree, and bio

## Requirements

### Requirement 1: Student Mentor Profile Management

**User Story:** As a Student_Mentor, I want to create and manage my profile with academic and personal information, so that Prospective_Students can learn about me before booking a session.

#### Acceptance Criteria

1. WHEN a Student_Mentor creates a profile, THE Cal_System SHALL store university name, degree program, field of study, current year, biography, profile photo, and LinkedIn URL
2. WHEN a Student_Mentor updates their profile, THE Cal_System SHALL validate all required fields (university, degree, field, year, bio) are present
3. WHEN a Student_Mentor uploads a profile photo, THE Cal_System SHALL resize it to 400x400 pixels and store it securely
4. WHEN a Student_Mentor sets their profile status, THE Cal_System SHALL allow toggling between active and inactive states
5. THE Cal_System SHALL prevent profiles with missing required fields from being displayed to Prospective_Students

### Requirement 2: Availability Schedule Management

**User Story:** As a Student_Mentor, I want to connect my Google Calendar and define my availability, so that Prospective_Students can only book sessions when I'm free.

#### Acceptance Criteria

1. WHEN a Student_Mentor connects their Google Calendar, THE Cal_System SHALL use OAuth2 authentication and request calendar read/write permissions
2. WHEN a Student_Mentor defines availability hours, THE Cal_System SHALL store recurring weekly schedules with timezone information
3. WHEN a Student_Mentor has a conflicting event in Google Calendar, THE Cal_System SHALL exclude those time slots from available booking times
4. WHEN availability is updated, THE Cal_System SHALL sync changes to Google Calendar within 60 seconds
5. THE Cal_System SHALL prevent double-booking by checking both Cal_System bookings and Google Calendar events

### Requirement 3: Session Duration Enforcement

**User Story:** As a system administrator, I want all sessions to be exactly 15 minutes, so that the platform maintains consistency and fairness.

#### Acceptance Criteria

1. THE Cal_System SHALL enforce a fixed 15-minute duration for all sessions
2. WHEN a Student_Mentor attempts to create a custom event type, THE Cal_System SHALL prevent modification of session duration
3. WHEN displaying available time slots, THE Cal_System SHALL show only 15-minute intervals
4. THE Cal_System SHALL reject any API requests attempting to create sessions with durations other than 15 minutes

### Requirement 4: Student Mentor Discovery by Field

**User Story:** As a Prospective_Student, I want to browse Student_Mentors by academic field, so that I can find mentors relevant to my interests.

#### Acceptance Criteria

1. WHEN a Prospective_Student requests mentors by field, THE Cal_System SHALL return all active Student_Mentors in that field
2. WHEN displaying Student_Mentor results, THE Cal_System SHALL include profile photo, name, university, degree, year, and bio excerpt (first 150 characters)
3. WHEN no Student_Mentors are available in a field, THE Cal_System SHALL return an empty list with appropriate messaging
4. THE Cal_System SHALL order results by availability (mentors with more available slots first)
5. THE Cal_System SHALL exclude inactive Student_Mentor profiles from search results

### Requirement 5: Session Booking Process

**User Story:** As a Prospective_Student, I want to book a 15-minute session with a Student_Mentor, so that I can get answers to my questions about university.

#### Acceptance Criteria

1. WHEN a Prospective_Student selects a Student_Mentor, THE Cal_System SHALL display available time slots for the next 30 days
2. WHEN a Prospective_Student books a session, THE Cal_System SHALL collect name, email, and optional question/topic
3. WHEN a booking is confirmed, THE Cal_System SHALL create a Google Meet link and add the event to both calendars
4. WHEN a booking is confirmed, THE Cal_System SHALL send email confirmations with ICS calendar attachments to both parties within 2 minutes
5. THE Cal_System SHALL prevent booking time slots that are less than 2 hours in the future

### Requirement 6: Email Notifications with Thotis Branding

**User Story:** As a user of the platform, I want to receive branded email notifications, so that the experience feels integrated with Thotis.

#### Acceptance Criteria

1. WHEN the Cal_System sends any email, THE Cal_System SHALL use Thotis logo, colors (#FF6B35 orange, #004E89 blue), and fonts (Montserrat, Inter)
2. WHEN a booking is confirmed, THE Cal_System SHALL send emails to both Student_Mentor and Prospective_Student with session details and Google Meet link
3. WHEN a session is 24 hours away, THE Cal_System SHALL send reminder emails to both parties
4. WHEN a booking is cancelled, THE Cal_System SHALL send cancellation notifications to both parties within 2 minutes
5. WHEN a session is rescheduled, THE Cal_System SHALL send updated calendar invitations to both parties

### Requirement 7: Session Statistics and Ratings

**User Story:** As a Student_Mentor, I want to see statistics about my sessions, so that I can track my contribution to the community.

#### Acceptance Criteria

1. WHEN a Student_Mentor views their dashboard, THE Cal_System SHALL display total sessions completed, total sessions scheduled, and cancellation rate
2. WHEN a session is completed, THE Cal_System SHALL increment the Student_Mentor's completed session count
3. WHEN a Prospective_Student rates a session, THE Cal_System SHALL store the rating (1-5 stars) and optional feedback
4. WHEN calculating average rating, THE Cal_System SHALL compute the mean of all received ratings rounded to one decimal place
5. THE Cal_System SHALL display session statistics on the Student_Mentor's public profile

### Requirement 8: API Integration with Thotis Website

**User Story:** As a Thotis website developer, I want REST API endpoints to integrate mentoring functionality, so that users never leave the Thotis website.

#### Acceptance Criteria

1. WHEN the Thotis_Platform requests Student_Mentors by field, THE Cal_System SHALL provide a GET /api/v2/students/by-field/:field endpoint returning JSON
2. WHEN the Thotis_Platform requests a Student_Mentor's availability, THE Cal_System SHALL provide a GET /api/v2/students/:id/availability endpoint with date range parameters
3. WHEN the Thotis_Platform creates a booking, THE Cal_System SHALL provide a POST /api/v2/bookings endpoint accepting student_mentor_id, date, time, and prospective_student details
4. WHEN the Thotis_Platform updates a Student_Mentor profile, THE Cal_System SHALL provide a PUT /api/v2/students/:id/profile endpoint with authentication
5. THE Cal_System SHALL require API authentication using JWT tokens for all endpoints

### Requirement 9: Booking Widget Embedding

**User Story:** As a Thotis website user, I want to book sessions without leaving the Thotis website, so that I have a seamless experience.

#### Acceptance Criteria

1. WHEN the Thotis_Platform embeds the Booking_Widget, THE Cal_System SHALL provide an iframe-compatible booking interface
2. WHEN the Booking_Widget is displayed, THE Cal_System SHALL apply Thotis branding (colors, fonts, logo)
3. WHEN a user interacts with the Booking_Widget, THE Cal_System SHALL communicate booking status to the parent page via postMessage API
4. THE Booking_Widget SHALL be responsive and work on mobile devices (minimum width 320px)
5. THE Cal_System SHALL allow the Thotis_Platform to pre-fill Prospective_Student information via URL parameters

### Requirement 10: Webhook Events for Analytics

**User Story:** As a Thotis platform administrator, I want to receive webhook notifications for booking events, so that I can track usage and send data to analytics tools.

#### Acceptance Criteria

1. WHEN a booking is created, THE Cal_System SHALL send a webhook POST request to configured endpoints with booking details
2. WHEN a booking is cancelled, THE Cal_System SHALL send a webhook POST request with cancellation reason
3. WHEN a session is completed, THE Cal_System SHALL send a webhook POST request with completion status
4. WHEN a webhook delivery fails, THE Cal_System SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
5. THE Cal_System SHALL sign webhook payloads with HMAC-SHA256 for verification

### Requirement 11: Google Calendar Synchronization

**User Story:** As a Student_Mentor, I want my Cal.com bookings to appear in my Google Calendar, so that I can manage all my appointments in one place.

#### Acceptance Criteria

1. WHEN a booking is created, THE Cal_System SHALL add the event to the Student_Mentor's Google Calendar within 60 seconds
2. WHEN a booking is cancelled, THE Cal_System SHALL remove the event from Google Calendar within 60 seconds
3. WHEN a booking is rescheduled, THE Cal_System SHALL update the Google Calendar event with new date and time
4. WHEN the Cal_System detects a conflict in Google Calendar, THE Cal_System SHALL mark those time slots as unavailable
5. THE Cal_System SHALL sync calendar changes bidirectionally every 5 minutes

### Requirement 12: Video Call Integration

**User Story:** As a session participant, I want automatic video call links, so that I can easily join sessions without technical setup.

#### Acceptance Criteria

1. WHEN a booking is created, THE Cal_System SHALL generate a unique Google Meet link
2. WHEN a booking confirmation email is sent, THE Cal_System SHALL include the Google Meet link prominently
3. WHEN a participant clicks the Google Meet link, THE Cal_System SHALL ensure the link is valid and accessible
4. THE Cal_System SHALL include the Google Meet link in calendar event descriptions
5. THE Cal_System SHALL generate new Google Meet links for rescheduled sessions

### Requirement 13: Cancellation and Rescheduling

**User Story:** As a session participant, I want to cancel or reschedule sessions, so that I can manage unexpected conflicts.

#### Acceptance Criteria

1. WHEN a participant cancels a session, THE Cal_System SHALL allow cancellation up to 2 hours before the scheduled time
2. WHEN a cancellation occurs, THE Cal_System SHALL send notifications to both parties and remove calendar events
3. WHEN a Student_Mentor cancels a session, THE Cal_System SHALL increment their cancellation count
4. WHEN a participant requests to reschedule, THE Cal_System SHALL display available alternative time slots
5. THE Cal_System SHALL prevent cancellations less than 2 hours before the session start time

### Requirement 14: GDPR Compliance and Data Privacy

**User Story:** As a platform administrator, I want to comply with GDPR regulations, so that we protect user privacy and avoid legal issues.

#### Acceptance Criteria

1. WHEN a user creates an account, THE Cal_System SHALL obtain explicit consent for data processing
2. WHEN a user requests their data, THE Cal_System SHALL provide a complete export of their personal information within 30 days
3. WHEN a user requests account deletion, THE Cal_System SHALL anonymize or delete their personal data within 30 days
4. WHEN a Prospective_Student is under 18, THE Cal_System SHALL require parental consent before booking sessions
5. THE Cal_System SHALL store all personal data within EU servers or servers with adequate data protection

### Requirement 15: Mobile Responsiveness

**User Story:** As a mobile user, I want the platform to work seamlessly on my smartphone, so that I can book and manage sessions on the go.

#### Acceptance Criteria

1. WHEN a user accesses the Booking_Widget on mobile, THE Cal_System SHALL display a touch-optimized interface
2. WHEN displaying Student_Mentor profiles on mobile, THE Cal_System SHALL use a single-column layout with readable font sizes (minimum 16px)
3. WHEN selecting time slots on mobile, THE Cal_System SHALL provide large, tappable buttons (minimum 44x44px)
4. THE Cal_System SHALL support viewport widths from 320px to 1920px
5. WHEN a user rotates their device, THE Cal_System SHALL adapt the layout appropriately

### Requirement 16: Error Handling and Monitoring

**User Story:** As a platform administrator, I want comprehensive error tracking, so that I can quickly identify and fix issues.

#### Acceptance Criteria

1. WHEN an error occurs in the Cal_System, THE Cal_System SHALL log the error to Sentry with full context (user ID, request details, stack trace)
2. WHEN a booking fails, THE Cal_System SHALL display a user-friendly error message and log technical details separately
3. WHEN an API request fails, THE Cal_System SHALL return appropriate HTTP status codes (400 for client errors, 500 for server errors)
4. WHEN a critical error occurs (database connection failure, payment processing error), THE Cal_System SHALL send alerts to administrators
5. THE Cal_System SHALL maintain 99.5% uptime measured over 30-day periods

### Requirement 17: Performance Requirements

**User Story:** As a user, I want the platform to load quickly and respond instantly, so that I have a smooth booking experience.

#### Acceptance Criteria

1. WHEN a user loads the Student_Mentor list page, THE Cal_System SHALL return results within 500ms
2. WHEN a user views available time slots, THE Cal_System SHALL calculate and display availability within 1 second
3. WHEN a user submits a booking, THE Cal_System SHALL confirm the booking within 2 seconds
4. THE Cal_System SHALL handle at least 100 concurrent users without performance degradation
5. WHEN serving static assets (images, CSS, JavaScript), THE Cal_System SHALL use CDN caching with 1-year expiration

### Requirement 18: Search and Filtering

**User Story:** As a Prospective_Student, I want to filter Student_Mentors by multiple criteria, so that I can find the most relevant mentor for my needs.

#### Acceptance Criteria

1. WHEN a Prospective_Student filters by field, THE Cal_System SHALL return only Student_Mentors in that field
2. WHEN a Prospective_Student filters by university, THE Cal_System SHALL return only Student_Mentors from that university
3. WHEN a Prospective_Student filters by availability, THE Cal_System SHALL return only Student_Mentors with available slots in the next 7 days
4. WHEN multiple filters are applied, THE Cal_System SHALL combine them with AND logic
5. THE Cal_System SHALL display the number of results matching current filters

### Requirement 19: Session Feedback Collection

**User Story:** As a platform administrator, I want to collect feedback after sessions, so that we can improve the mentoring experience and identify top mentors.

#### Acceptance Criteria

1. WHEN a session is completed, THE Cal_System SHALL send a feedback request email to the Prospective_Student within 1 hour
2. WHEN a Prospective_Student submits feedback, THE Cal_System SHALL collect a rating (1-5 stars) and optional text comment
3. WHEN feedback is submitted, THE Cal_System SHALL update the Student_Mentor's average rating
4. WHEN a Student_Mentor receives a rating below 3 stars, THE Cal_System SHALL flag the session for administrator review
5. THE Cal_System SHALL display aggregate feedback statistics on Student_Mentor profiles (average rating, total reviews)

### Requirement 20: Admin Dashboard

**User Story:** As a platform administrator, I want a dashboard to monitor platform health and usage, so that I can make data-driven decisions.

#### Acceptance Criteria

1. WHEN an administrator accesses the dashboard, THE Cal_System SHALL display total active Student_Mentors, total sessions completed, and total sessions scheduled
2. WHEN viewing analytics, THE Cal_System SHALL show session trends over time (daily, weekly, monthly)
3. WHEN reviewing Student_Mentors, THE Cal_System SHALL display a list with completion rates, cancellation rates, and average ratings
4. WHEN monitoring system health, THE Cal_System SHALL display API response times, error rates, and uptime percentage
5. THE Cal_System SHALL allow administrators to export reports in CSV format
