# Implementation Plan: Thotis Student Mentoring Platform

## Overview

This implementation plan breaks down the Thotis Student Mentoring Platform into incremental, testable tasks. The approach follows Cal.com's architecture patterns, extending the existing codebase with new models, services, and API endpoints. Each task builds on previous work, with checkpoints to ensure quality and gather feedback.

## Tasks

- [x] 1. Database Schema and Migrations
  - [x] 1.1 Add StudentProfile and SessionRating models to Prisma schema
    - Add StudentProfile model with all fields (university, degree, field, currentYear, bio, profilePhotoUrl, linkedInUrl, isActive, statistics)
    - Add SessionRating model with fields (bookingId, studentProfileId, rating, feedback, prospectiveEmail)
    - Add AcademicField enum (LAW, MEDICINE, ENGINEERING, BUSINESS, COMPUTER_SCIENCE, PSYCHOLOGY, EDUCATION, ARTS, SCIENCES, OTHER)
    - Add indexes for performance (field + isActive, userId, studentProfileId, bookingId)
    - Add relation to User model (one-to-one with StudentProfile)
    - Add relation to Booking model (one-to-one with SessionRating)
    - _Requirements: 1.1, 7.3, 7.4_
  
  - [x] 1.2 Create and run database migrations
    - Generate Prisma migration files
    - Run migrations on development database
    - Verify schema changes with `yarn prisma generate`
    - _Requirements: 1.1, 7.3_
  
  - [x] 1.3 Write property test for StudentProfile model
    - **Property 1: Profile Data Round Trip**
    - **Validates: Requirements 1.1, 1.2**
  
  - [x] 1.4 Write property test for SessionRating model
    - **Property 20: Rating Storage and Validation**
    - **Validates: Requirements 7.3, 19.2**

- [x] 2. Profile Repository Layer
  - [x] 2.1 Create ProfileRepository in packages/features/thotis/repositories/
    - Implement createProfile(userId, data) with validation
    - Implement updateProfile(profileId, data) with validation
    - Implement getProfile(profileId) using select (not include)
    - Implement getProfileByUserId(userId) using select
    - Implement getProfilesByField(field, options) with pagination
    - Implement searchProfiles(query) with multiple filters
    - Use early returns for null checks
    - _Requirements: 1.1, 1.2, 4.1, 18.1, 18.2, 18.3, 18.4_
  
  - [x] 2.2 Write property test for profile validation
    - **Property 2: Profile Photo Normalization**
    - **Validates: Requirements 1.3**
  
  - [x] 2.3 Write property test for incomplete profile exclusion
    - **Property 4: Incomplete Profile Exclusion**
    - **Validates: Requirements 1.5**
  
  - [x] 2.4 Write unit tests for ProfileRepository edge cases
    - Test null profile photo URL handling
    - Test bio length validation (min 50, max 1000)
    - Test invalid field enum values
    - Test currentYear boundaries (1-10)
    - _Requirements: 1.2, 1.3_

- [x] 3. Profile Service Layer
  - [x] 3.1 Create ProfileService in packages/features/thotis/services/
    - Implement createProfile with ErrorWithCode for validation errors
    - Implement updateProfile with field validation
    - Implement getProfile with caching (Redis, 5 min TTL)
    - Implement getProfilesByField with caching (Redis, 1 min TTL)
    - Implement searchProfiles with AND filter logic
    - Implement activateProfile and deactivateProfile
    - Add profile photo resizing to 400x400 pixels
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.4, 18.1, 18.2, 18.3, 18.4_
  
  - [x] 3.2 Write property test for field-based filtering
    - **Property 9: Field-Based Filtering**
    - **Validates: Requirements 4.1, 4.5, 18.1**
  
  - [x] 3.3 Write property test for profile summary format
    - **Property 10: Profile Summary Format**
    - **Validates: Requirements 4.2**
  
  - [x] 3.4 Write property test for multiple filter AND logic
    - **Property 40: Multiple Filter AND Logic**
    - **Validates: Requirements 18.4**

- [x] 4. Checkpoint - Profile Management Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Booking Service Extensions
  - [x] 5.1 Create ThotisBookingService in packages/features/thotis/services/
    - Implement createStudentSession with 15-minute duration enforcement
    - Implement getStudentAvailability with 30-day window
    - Implement cancelSession with 2-hour minimum notice validation
    - Implement rescheduleSession with new Google Meet link generation
    - Implement markSessionComplete
    - Add double-booking prevention logic
    - Add calendar conflict checking
    - Use ErrorWithCode for business logic errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.5, 13.1, 13.5_
  
  - [x] 5.2 Write property test for session duration invariant
    - **Property 8: Session Duration Invariant**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [x] 5.3 Write property test for double booking prevention
    - **Property 7: Double Booking Prevention**
    - **Validates: Requirements 2.5**
  
  - [x] 5.4 Write property test for minimum booking notice
    - **Property 14: Minimum Booking Notice**
    - **Validates: Requirements 5.5, 13.1, 13.5**
  
  - [x] 5.5 Write property test for availability time window
    - **Property 12: Availability Time Window**
    - **Validates: Requirements 5.1**

- [x] 6. Statistics Service
  - [x] 6.1 Create StatisticsService in packages/features/thotis/services/
    - Implement getStudentStats with caching (Redis, 10 min TTL)
    - Implement updateSessionCount (scheduled, completed, cancelled)
    - Implement addRating with validation (1-5 stars)
    - Implement recalculateAverageRating (mean rounded to 1 decimal)
    - Implement getPlatformStats with aggregation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 19.2, 19.3, 19.4, 20.1, 20.2, 20.3_
  
  - [x] 6.2 Write property test for statistics calculation accuracy
    - **Property 18: Statistics Calculation Accuracy**
    - **Validates: Requirements 7.1**
  
  - [x] 6.3 Write property test for session counter updates
    - **Property 19: Session Counter Updates**
    - **Validates: Requirements 7.2, 13.3**
  
  - [x] 6.4 Write property test for average rating calculation
    - **Property 21: Average Rating Calculation**
    - **Validates: Requirements 7.4, 19.3**
  
  - [x] 6.5 Write property test for low rating flagging
    - **Property 42: Low Rating Flagging**
    - **Validates: Requirements 19.4**

- [x] 7. Webhook Service
  - [x] 7.1 Create WebhookService in packages/features/thotis/services/
    - Implement sendBookingCreated with HMAC-SHA256 signature
    - Implement sendBookingCancelled with reason
    - Implement sendBookingCompleted
    - Implement sendBookingRescheduled with old/new datetime
    - Implement retryFailedWebhook with exponential backoff (1s, 2s, 4s)
    - Add webhook payload signing
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 7.2 Write property test for webhook payload signature
    - **Property 27: Webhook Payload Signature**
    - **Validates: Requirements 10.5**
  
  - [x] 7.3 Write property test for webhook event types
    - **Property 28: Webhook Event Types**
    - **Validates: Requirements 10.1, 10.2, 10.3**
  
  - [x] 7.4 Write property test for webhook retry backoff
    - **Property 29: Webhook Retry Exponential Backoff**
    - **Validates: Requirements 10.4**

- [x] 8. Checkpoint - Core Services Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. REST API v2 Endpoints
  - [x] 9.1 Create student profile endpoints in apps/api/v2/students/
    - Implement GET /api/v2/students/by-field/:field with pagination
    - Implement GET /api/v2/students/:id
    - Implement GET /api/v2/students/:id/availability with date range
    - Implement POST /api/v2/students/:id/profile with JWT auth
    - Implement PUT /api/v2/students/:id/profile with JWT auth
    - Implement PATCH /api/v2/students/:id/status with JWT auth
    - Add JWT token validation middleware
    - Return consistent JSON format (status, data)
    - Use HTTP 400 for client errors, 500 for server errors
    - Re-export services from packages/platform/libraries/index.ts
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 16.3_
  
  - [x] 9.2 Write property test for API authentication enforcement
    - **Property 23: API Authentication Enforcement**
    - **Validates: Requirements 8.5**
  
  - [x] 9.3 Write property test for API response format consistency
    - **Property 24: API Response Format Consistency**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
  
  - [x] 9.4 Write property test for HTTP status code correctness
    - **Property 37: HTTP Status Code Correctness**
    - **Validates: Requirements 16.3**

- [x] 10. Booking API Endpoints
  - [x] 10.1 Create booking endpoints in apps/api/v2/bookings/
    - Implement POST /api/v2/bookings with validation
    - Implement GET /api/v2/bookings/:id
    - Implement DELETE /api/v2/bookings/:id (cancel)
    - Implement PATCH /api/v2/bookings/:id/reschedule
    - Add JWT token validation
    - Return booking with Google Meet link
    - _Requirements: 8.3, 12.1, 12.2, 12.4, 13.1, 13.2, 13.4_
  
  - [x] 10.2 Write property test for Google Meet link uniqueness
    - **Property 30: Google Meet Link Uniqueness**
    - **Validates: Requirements 12.1**
  
  - [x] 10.3 Write property test for rescheduling Meet link regeneration
    - **Property 32: Rescheduling Meet Link Regeneration**
    - **Validates: Requirements 12.5**

- [x] 11. Rating API Endpoints
  - [x] 11.1 Create rating endpoints in apps/api/v2/bookings/
    - Implement POST /api/v2/bookings/:id/rating
    - Implement GET /api/v2/students/:id/ratings
    - Validate rating is 1-5 stars
    - Validate feedback max 500 characters
    - Trigger average rating recalculation
    - _Requirements: 7.3, 7.4, 19.2, 19.3_
  
  - [x] 11.2 Write property test for rating storage and validation
    - **Property 20: Rating Storage and Validation**
    - **Validates: Requirements 7.3, 19.2**

- [x] 12. Statistics API Endpoints
  - [x] 12.1 Create statistics endpoints in apps/api/v2/students/ and apps/api/v2/platform/
    - Implement GET /api/v2/students/:id/stats
    - Implement GET /api/v2/platform/stats
    - Return cached statistics
    - Include session trends (daily, weekly, monthly)
    - _Requirements: 7.1, 7.5, 20.1, 20.2, 20.3_
  
  - [x] 12.2 Write property test for platform statistics aggregation
    - **Property 43: Platform Statistics Aggregation**
    - **Validates: Requirements 20.1**

- [x] 13. Checkpoint - API Layer Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Email Templates with Thotis Branding
  - [x] 14.1 Create custom email templates in packages/emails/templates/thotis/
    - Create booking-confirmation.tsx with Thotis branding
    - Create booking-reminder.tsx (24 hours before)
    - Create booking-cancellation.tsx
    - Create booking-rescheduled.tsx
    - Create feedback-request.tsx
    - Use Thotis colors (#FF6B35, #004E89)
    - Use Montserrat and Inter fonts
    - Include Thotis logo
    - Include Google Meet link prominently
    - _Requirements: 6.1, 6.2, 6.5, 12.2, 12.4, 16.2, 17.1_
  
  - [x] 14.2 Write property test for email branding consistency
    - **Property 15: Email Branding Consistency**
    - **Validates: Requirements 6.1**
  
  - [x] 14.3 Write property test for booking confirmation email content
    - **Property 16: Booking Confirmation Email Content**
    - **Validates: Requirements 6.2**

- [x] 15. tRPC Routers for Internal APIs
  - [x] 15.1 Create thotis.ts router in packages/trpc/server/routers/
    - Create profileRouter with CRUD operations
    - Create bookingRouter with session management
    - Create statisticsRouter with analytics
    - Use TRPCError for error handling
    - Add authentication middleware
    - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.2, 7.1, 13.1, 13.2_
  
  - [x] 15.2 Write integration tests for tRPC routers
    - Test authenticated and unauthenticated requests
    - Test error handling
    - Test data validation
    - _Requirements: 8.5_

- [x] 16. Booking Widget UI Component
  - [x] 16.1 Create BookingWidget component in packages/features/thotis/components/
    - Create iframe-compatible booking interface
    - Apply Thotis branding (colors, fonts, logo)
    - Implement postMessage communication with parent
    - Support URL parameter pre-filling (name, email)
    - Make responsive (min width 320px)
    - Add loading states and error handling
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 15.1, 15.2, 15.3_
  
  - [x] 16.2 Write property test for widget postMessage communication
    - **Property 25: Widget PostMessage Communication**
    - **Validates: Requirements 9.3**
  
  - [x] 16.3 Write property test for URL parameter pre-filling
    - **Property 26: URL Parameter Pre-filling**
    - **Validates: Requirements 9.5**

- [x] 17. Student Profile Card Component
  - [ ] 17.1 Create ProfileCard component in packages/features/thotis/components/
    - Display profile photo, name, university, degree, year
    - Display bio excerpt (first 150 characters)
    - Display average rating and total ratings
    - Display availability indicator
    - Add "Book Session" button (optional)
    - Make responsive
    - _Requirements: 4.2, 7.5_

- [x] 18. Admin Dashboard
  - [x] 18.1 Create AdminDashboard component in packages/features/thotis/components/
    - Display platform overview (total mentors, sessions, completion rate)
    - Display student mentor list (sortable by rating, sessions, cancellation rate)
    - Display session trends chart (daily, weekly, monthly)
    - Display field distribution pie chart
    - Add CSV export functionality
    - _Requirements: 20.1, 20.2, 20.3, 20.5_
  
  - [x] 18.2 Write property test for CSV export format validity
    - **Property 46: CSV Export Format Validity**
    - **Validates: Requirements 20.5**

- [x] 19. Checkpoint - UI Components Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Error Handling and Monitoring
  - [/] 20.1 Integrate Sentry error logging
    - Add Sentry.captureException calls in all error handlers
    - Include user ID, request details, and stack trace
    - Add feature tag "thotis-mentoring"
    - Add error code tags
    - _Requirements: 16.1, 16.2_
  
  - [ ] 20.2 Write property test for error logging context completeness
    - **Property 35: Error Logging Context Completeness**
    - **Validates: Requirements 16.1**
  
  - [ ] 20.3 Write property test for user-friendly error messages
    - **Property 36: User-Friendly Error Messages**
    - **Validates: Requirements 16.2**

- [x] 21. Mixpanel Analytics Integration
  - [x] 21.1 Add Mixpanel tracking events
    - Track profile_created event
    - Track booking_created event
    - Track booking_cancelled event
    - Track booking_completed event
    - Track rating_submitted event
    - Include relevant properties (field, university, rating, etc.)
    - _Requirements: 7.1, 7.2, 7.3, 13.3_

- [x] 22. Translations (i18n)
  - [x] 22.1 Add French translations to apps/web/public/static/locales/fr/common.json
    - Add all UI strings for booking widget
    - Add all UI strings for profile cards
    - Add all UI strings for admin dashboard
    - Add all email template strings
    - _Requirements: 6.1, 6.2, 9.1, 9.2_
  
  - [x] 22.2 Add English translations to apps/web/public/static/locales/en/common.json
    - Add all UI strings (same as French)
    - _Requirements: 6.1, 6.2, 9.1, 9.2_

- [x] 23. Caching Implementation
  - [x] 23.1 Set up Redis caching for frequently accessed data
    - Implement profile caching (5 min TTL)
    - Implement profile list caching (1 min TTL)
    - Implement statistics caching (10 min TTL)
    - Implement availability caching (2 min TTL)
    - Add cache invalidation on updates
    - _Requirements: 4.1, 4.2, 7.1, 7.5_

- [/] 24. Background Jobs
  - [ ] 24.1 Create background job for 24-hour reminders
    - Query bookings 24 hours in advance
    - Send reminder emails to both parties
    - Log to Mixpanel
    - _Requirements: 6.3_
  
  - [ ] 24.2 Create background job for feedback requests
    - Query completed bookings (1 hour after completion)
    - Send feedback request email to prospective student
    - _Requirements: 19.1_
  
  - [ ] 24.3 Create background job for calendar sync
    - Sync Google Calendar changes every 5 minutes
    - Update availability based on conflicts
    - _Requirements: 11.5_

- [/] 25. Checkpoint - Infrastructure Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Integration Testing
  - [ ] 26.1 Write integration tests for complete booking flow
    - Test profile creation → availability check → booking → confirmation
    - Test booking → cancellation → notification
    - Test booking → completion → rating → statistics update
    - _Requirements: 1.1, 5.1, 5.2, 6.2, 7.2, 7.3, 13.2_
  
  - [ ] 26.2 Write integration tests for API endpoints
    - Test all REST API v2 endpoints
    - Test authentication and authorization
    - Test error handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 27. Documentation
  - [x] 27.1 Create API documentation
    - Document all REST API v2 endpoints
    - Include request/response examples
    - Document authentication requirements
    - Document error codes
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 27.2 Create deployment guide
    - Document environment variables
    - Document Redis setup
    - Document database migrations
    - Document Coolify deployment steps
    - _Requirements: All_
  
  - [ ] 27.3 Create AGPLv3 compliance documentation
    - Document all modifications to Cal.com
    - Prepare source code for publication
    - Document license requirements
    - _Requirements: All_

- [x] 28. Security Hardening
  - [x] 28.1 Implement rate limiting
    - Add rate limiting to public API endpoints
    - Add rate limiting to booking widget
    - Configure limits (e.g., 100 requests/hour per IP)
    - _Requirements: 8.1, 8.2, 8.3, 9.1_
  
  - [x] 28.2 Implement input sanitization
    - Sanitize all user inputs to prevent XSS
    - Validate all email addresses
    - Validate all URLs
    - _Requirements: 1.1, 1.2, 5.2, 7.3_
  
  - [x] 28.3 Configure CORS
    - Restrict CORS to Thotis domain only
    - Add CORS headers to all API responses
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 29. Performance Testing
  - [ ] 29.1 Run load tests
    - Test 100 concurrent users
    - Measure API response times (p50, p95, p99)
    - Verify no performance degradation
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  
  - [ ] 29.2 Optimize slow queries
    - Identify slow database queries
    - Add missing indexes
    - Optimize N+1 queries
    - _Requirements: 17.1, 17.2_

- [ ] 30. Final Checkpoint - System Complete
  - Run full test suite (unit, property, integration)
  - Run type check: `yarn type-check:ci --force`
  - Run linter: `yarn biome check --write .`
  - Verify all requirements are met
  - Ask the user if ready for deployment

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (min 100 iterations each)
- Unit tests validate specific examples and edge cases
- Follow Cal.com conventions: use `select` not `include`, use `ErrorWithCode` in services, use `TRPCError` in tRPC routers
- Import from `@calcom/platform-libraries` when importing into apps/api/v2
- Add all UI strings to translation files
- Run `yarn type-check:ci --force` before concluding tasks
- Keep PRs small (<500 lines, <10 files) by splitting tasks into multiple PRs
