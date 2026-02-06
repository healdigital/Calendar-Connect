# Requirements Document: Magic Link Invalidation

## Introduction

This specification defines the security enhancement for invalidating magic links after booking lifecycle events in the Thotis student mentoring platform. Magic links provide passwordless access to prospective students for viewing and managing their mentoring sessions. Currently, these links remain valid even after critical booking state changes (cancellation, rescheduling, rating, or reporting), creating a security vulnerability where stale links could be used to access outdated or invalid session information.

This feature ensures that magic links are automatically invalidated when booking state changes occur, preventing unauthorized or inappropriate access to session data.

## Glossary

- **Magic_Link**: A time-limited, tokenized URL that provides passwordless authentication for prospective students to access their booking sessions
- **Token**: A cryptographically secure, hashed identifier stored in the database that validates a magic link
- **Booking_Lifecycle_Event**: A state change in a booking including cancellation, rescheduling, rating submission, or incident reporting
- **Prospective_Student**: A guest user (non-authenticated) who books a mentoring session and receives magic links for access
- **Session**: A 15-minute mentoring booking between a student mentor and a prospective student
- **Invalidation**: The process of marking a token as unusable, preventing further access via the associated magic link
- **Token_Hash**: A SHA-256 hash of the raw token stored in the database for secure verification

## Requirements

### Requirement 1: Automatic Token Invalidation on Booking Cancellation

**User Story:** As a security engineer, I want magic links to be invalidated when a booking is cancelled, so that prospective students cannot access cancelled session information.

#### Acceptance Criteria

1. WHEN a booking is cancelled by the mentor, THE System SHALL invalidate all magic link tokens associated with that booking
2. WHEN a booking is cancelled by the prospective student, THE System SHALL invalidate all magic link tokens associated with that booking
3. WHEN a booking is automatically cancelled due to no-show, THE System SHALL invalidate all magic link tokens associated with that booking
4. WHEN a token is invalidated, THE System SHALL set the `invalidated` field to true and record the `usedAt` timestamp
5. WHEN an invalidated token is used for access, THE System SHALL return an unauthorized error with message "Token expired or used"

### Requirement 2: Automatic Token Invalidation on Booking Rescheduling

**User Story:** As a security engineer, I want magic links to be invalidated when a booking is rescheduled, so that old links pointing to outdated session times cannot be used.

#### Acceptance Criteria

1. WHEN a booking is rescheduled to a new time, THE System SHALL invalidate all existing magic link tokens associated with that booking
2. WHEN tokens are invalidated during rescheduling, THE System SHALL generate a new magic link token for the rescheduled booking
3. WHEN a new token is generated, THE System SHALL send the new magic link to the prospective student's email
4. WHEN an old token from a rescheduled booking is used, THE System SHALL return an unauthorized error
5. THE System SHALL ensure the new token has the same TTL (15 minutes) as the original token configuration

### Requirement 3: Automatic Token Invalidation on Session Rating

**User Story:** As a security engineer, I want magic links to be invalidated after a session is rated, so that the rating action cannot be performed multiple times with the same link.

#### Acceptance Criteria

1. WHEN a prospective student submits a rating for a session, THE System SHALL invalidate the magic link token used for that rating action
2. WHEN a token is invalidated after rating, THE System SHALL prevent the same token from being used to submit another rating
3. WHEN an invalidated rating token is used, THE System SHALL return an unauthorized error
4. THE System SHALL allow viewing session details with a valid token even after rating, but prevent rating submission with an invalidated token

### Requirement 4: Automatic Token Invalidation on Incident Reporting

**User Story:** As a security engineer, I want magic links to be invalidated after an incident is reported, so that the same link cannot be used to submit duplicate reports.

#### Acceptance Criteria

1. WHEN a prospective student reports an incident for a session, THE System SHALL invalidate the magic link token used for that report action
2. WHEN a token is invalidated after incident reporting, THE System SHALL prevent the same token from submitting another incident report
3. WHEN an invalidated incident token is used, THE System SHALL return an unauthorized error
4. THE System SHALL allow viewing session details with a valid token even after reporting, but prevent incident submission with an invalidated token

### Requirement 5: Token Invalidation Service Integration

**User Story:** As a developer, I want a centralized service method for token invalidation, so that all booking lifecycle events can consistently invalidate tokens.

#### Acceptance Criteria

1. THE ThotisGuestService SHALL provide a method `invalidateTokensByBookingId` that accepts a booking ID
2. WHEN `invalidateTokensByBookingId` is called, THE System SHALL find all tokens associated with that booking ID
3. WHEN tokens are found, THE System SHALL set `invalidated` to true and `usedAt` to the current timestamp for all matching tokens
4. WHEN no tokens are found for a booking ID, THE System SHALL complete successfully without error
5. THE System SHALL log token invalidation events in the ThotisGuestAccessLog for audit purposes

### Requirement 6: Backward Compatibility with Existing Tokens

**User Story:** As a system administrator, I want existing valid tokens to continue working until they expire naturally or a lifecycle event occurs, so that in-flight sessions are not disrupted.

#### Acceptance Criteria

1. WHEN the invalidation feature is deployed, THE System SHALL not invalidate existing valid tokens
2. WHEN an existing token is used before a lifecycle event, THE System SHALL allow access as before
3. WHEN a lifecycle event occurs on a booking with existing tokens, THE System SHALL invalidate those tokens
4. THE System SHALL maintain the existing 15-minute TTL for all tokens
5. THE System SHALL continue to respect the existing `expiresAt`, `usedAt`, and `invalidated` fields in token validation

### Requirement 7: Token Validation Enhancement

**User Story:** As a developer, I want the token verification logic to check invalidation status, so that invalidated tokens are rejected during access attempts.

#### Acceptance Criteria

1. WHEN a token is verified, THE System SHALL check if `invalidated` is true
2. WHEN a token is verified, THE System SHALL check if `usedAt` is not null
3. WHEN a token is verified, THE System SHALL check if `expiresAt` is less than the current time
4. WHEN any of these conditions are true, THE System SHALL throw an unauthorized error
5. WHEN all conditions are false, THE System SHALL return the valid token and associated guest information

### Requirement 8: Audit Logging for Token Invalidation

**User Story:** As a security auditor, I want all token invalidation events to be logged, so that I can track security-related actions for compliance.

#### Acceptance Criteria

1. WHEN tokens are invalidated, THE System SHALL create an entry in ThotisGuestAccessLog
2. WHEN logging invalidation, THE System SHALL record the guest ID, action type "INVALIDATE_TOKEN", and booking ID
3. WHEN logging invalidation, THE System SHALL record the reason (e.g., "booking_cancelled", "booking_rescheduled", "rating_submitted", "incident_reported")
4. WHEN logging invalidation, THE System SHALL mark the log entry as successful
5. THE System SHALL include timestamps for all audit log entries

### Requirement 9: Error Handling for Token Invalidation

**User Story:** As a developer, I want token invalidation to handle errors gracefully, so that booking lifecycle events are not blocked by invalidation failures.

#### Acceptance Criteria

1. WHEN token invalidation fails due to database errors, THE System SHALL log the error but not block the booking lifecycle event
2. WHEN token invalidation fails, THE System SHALL continue processing the booking event (cancel, reschedule, etc.)
3. WHEN token invalidation encounters a non-existent booking ID, THE System SHALL complete successfully
4. WHEN token invalidation encounters database connection issues, THE System SHALL retry once before logging and continuing
5. THE System SHALL provide clear error messages in logs for debugging token invalidation failures

### Requirement 10: Performance Optimization for Token Queries

**User Story:** As a performance engineer, I want token invalidation queries to be efficient, so that booking operations remain fast.

#### Acceptance Criteria

1. THE System SHALL use the existing `bookingId` index on ThotisMagicLinkToken for efficient queries
2. WHEN invalidating tokens, THE System SHALL use a single batch update operation rather than individual updates
3. WHEN querying tokens by booking ID, THE System SHALL use Prisma's `select` to fetch only required fields
4. THE System SHALL complete token invalidation operations in less than 100ms for typical cases
5. THE System SHALL not introduce additional N+1 query problems in booking lifecycle operations
