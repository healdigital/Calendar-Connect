# Implementation Plan: Magic Link Invalidation

## Overview

This implementation plan breaks down the Magic Link Invalidation feature into discrete, incremental coding tasks. The approach follows Cal.com's PR size guidelines by splitting the work into 4 phases, each resulting in a small, reviewable PR (<500 lines, <10 files).

The implementation follows a bottom-up approach:
1. Core service methods (ThotisGuestService enhancements)
2. Booking lifecycle integration (ThotisBookingService)
3. Rating and incident integration (SessionRatingService, MentorQualityRepository)
4. Monitoring and observability

Each task builds on previous tasks and includes testing to validate functionality incrementally.

## Tasks

### Phase 1: Core Service Layer (PR 1)

- [ ] 1. Enhance ThotisGuestService with token invalidation methods
  - [ ] 1.1 Add `invalidateTokensByBookingId` method to ThotisGuestService
    - Implement batch token invalidation by booking ID
    - Add reason parameter for audit logging
    - Return count of invalidated tokens
    - Use Prisma `updateMany` for efficient batch updates
    - Handle edge case: no tokens found (return 0)
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 1.2 Add `generateTokenForRescheduledBooking` method to ThotisGuestService
    - Generate new token for rescheduled bookings
    - Reuse existing guest identity or create new one
    - Set 15-minute TTL
    - Return raw token for email sending
    - _Requirements: 2.2, 2.5_
  
  - [ ] 1.3 Enhance `logAccess` method to support metadata
    - Add optional metadata parameter to existing method
    - Store invalidation reason in audit logs
    - _Requirements: 5.5, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 1.4 Write unit tests for `invalidateTokensByBookingId`
    - Test successful batch invalidation
    - Test empty booking (no tokens)
    - Test already invalidated tokens
    - Test database error handling
    - _Requirements: 5.2, 5.3, 5.4, 9.1, 9.2_
  
  - [ ]* 1.5 Write property test for token invalidation
    - **Property 1: Booking Lifecycle Events Invalidate Tokens**
    - **Property 5: Batch Token Invalidation**
    - **Validates: Requirements 1.1, 1.2, 1.3, 5.2, 5.3**
  
  - [ ]* 1.6 Write unit tests for `generateTokenForRescheduledBooking`
    - Test token generation with existing guest
    - Test token generation with new guest
    - Test blocked guest rejection
    - Test TTL is exactly 15 minutes
    - _Requirements: 2.2, 2.5, 6.4_
  
  - [ ]* 1.7 Write property test for token TTL invariant
    - **Property 7: Token TTL Invariant**
    - **Validates: Requirements 2.5, 6.4**
  
  - [ ]* 1.8 Write property test for audit log creation
    - **Property 8: Audit Log Creation**
    - **Validates: Requirements 5.5, 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: Booking Lifecycle Integration (PR 2)

- [ ] 3. Integrate token invalidation into ThotisBookingService
  - [ ] 3.1 Add ThotisGuestService dependency to ThotisBookingService constructor
    - Add optional guestService parameter
    - Initialize with new instance if not provided
    - Update existing tests to mock guestService
    - _Requirements: 5.1_
  
  - [ ] 3.2 Enhance `cancelSession` method with token invalidation
    - Call `invalidateTokensByBookingId` after booking cancellation
    - Wrap in try-catch for non-blocking error handling
    - Log success and failure cases
    - Pass reason: 'booking_cancelled'
    - _Requirements: 1.1, 1.2, 9.1, 9.2_
  
  - [ ] 3.3 Enhance `rescheduleSession` method with token invalidation and regeneration
    - Invalidate old tokens before rescheduling
    - Generate new token after rescheduling
    - Extract prospective student email from booking responses
    - Include new magic link in rescheduling email
    - Wrap in try-catch for non-blocking error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [ ] 3.4 Enhance `markSessionAsNoShow` method with token invalidation
    - Call `invalidateTokensByBookingId` after marking no-show
    - Wrap in try-catch for non-blocking error handling
    - Pass reason: 'booking_cancelled'
    - _Requirements: 1.3_
  
  - [ ]* 3.5 Write unit tests for enhanced `cancelSession`
    - Test token invalidation is called
    - Test cancellation succeeds even if invalidation fails
    - Test correct reason is passed
    - _Requirements: 1.1, 1.2, 9.1, 9.2_
  
  - [ ]* 3.6 Write unit tests for enhanced `rescheduleSession`
    - Test old tokens are invalidated
    - Test new token is generated
    - Test new token is included in email
    - Test rescheduling succeeds even if token operations fail
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 3.7 Write property test for rescheduling token regeneration
    - **Property 6: Rescheduling Token Regeneration**
    - **Validates: Requirements 2.2, 2.5, 6.4**
  
  - [ ]* 3.8 Write unit tests for enhanced `markSessionAsNoShow`
    - Test token invalidation is called
    - Test no-show marking succeeds even if invalidation fails
    - _Requirements: 1.3, 9.1, 9.2_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Rating & Incident Integration (PR 3)

- [ ] 5. Integrate token invalidation into SessionRatingService
  - [ ] 5.1 Add ThotisGuestService dependency to SessionRatingService constructor
    - Add optional guestService parameter
    - Initialize with new instance if not provided
    - Update existing tests to mock guestService
    - _Requirements: 5.1_
  
  - [ ] 5.2 Enhance `createRating` method with token invalidation
    - Call `invalidateTokensByBookingId` after successful rating creation
    - Wrap in try-catch for non-blocking error handling
    - Log success and failure cases
    - Pass reason: 'rating_submitted'
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 5.3 Write unit tests for enhanced `createRating`
    - Test token invalidation is called after rating
    - Test rating creation succeeds even if invalidation fails
    - Test correct reason is passed
    - _Requirements: 3.1, 3.2, 9.1, 9.2_

- [ ] 6. Integrate token invalidation into MentorQualityRepository
  - [ ] 6.1 Add ThotisGuestService dependency to MentorQualityRepository constructor
    - Add optional guestService parameter to deps
    - Initialize with new instance if not provided
    - Update existing tests to mock guestService
    - _Requirements: 5.1_
  
  - [ ] 6.2 Enhance `createIncident` method with token invalidation
    - Look up booking ID from booking UID
    - Call `invalidateTokensByBookingId` after incident creation
    - Wrap in try-catch for non-blocking error handling
    - Log success and failure cases
    - Pass reason: 'incident_reported'
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 6.3 Write unit tests for enhanced `createIncident`
    - Test booking lookup by UID
    - Test token invalidation is called after incident
    - Test incident creation succeeds even if invalidation fails
    - Test correct reason is passed
    - _Requirements: 4.1, 4.2, 9.1, 9.2_

- [ ] 7. Write comprehensive property tests for token verification
  - [ ]* 7.1 Write property test for invalid token rejection
    - **Property 3: Invalid Token Rejection**
    - **Validates: Requirements 1.5, 2.4, 3.2, 3.3, 4.2, 4.3, 6.5, 7.1, 7.2, 7.3, 7.4**
  
  - [ ]* 7.2 Write property test for valid token acceptance
    - **Property 4: Valid Token Acceptance**
    - **Validates: Requirements 7.5**
  
  - [ ]* 7.3 Write property test for empty booking invalidation idempotence
    - **Property 9: Empty Booking Invalidation Idempotence**
    - **Validates: Requirements 5.4, 9.3**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Monitoring & Documentation (PR 4)

- [ ] 9. Add monitoring and observability
  - [ ] 9.1 Add structured logging for token invalidation operations
    - Log invalidation success with booking ID, reason, token count, duration
    - Log invalidation failures with booking ID, reason, error details
    - Use consistent log format across all services
    - _Requirements: 9.5_
  
  - [ ] 9.2 Add metrics tracking for token invalidation
    - Track invalidation success rate
    - Track invalidation latency (p50, p95, p99)
    - Track number of tokens invalidated per booking
    - Track failed invalidation attempts
    - _Requirements: 10.4_
  
  - [ ] 9.3 Update existing error messages for clarity
    - Ensure "Token expired or used" message is consistent
    - Add context to error logs for debugging
    - _Requirements: 1.5, 9.5_

- [ ] 10. Update documentation and add migration notes
  - [ ] 10.1 Add inline code documentation
    - Document all new methods with JSDoc comments
    - Document error handling strategy
    - Document non-blocking behavior
    - _Requirements: All_
  
  - [ ] 10.2 Create migration guide for deployment
    - Document backward compatibility guarantees
    - Document monitoring setup
    - Document rollback procedure if needed
    - _Requirements: 6.1, 6.2_
  
  - [ ] 10.3 Update CHANGELOG.md
    - Add entry for magic link invalidation feature
    - Document security improvements
    - Document API changes (if any)
    - _Requirements: All_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each phase is designed to be a small, reviewable PR (<500 lines, <10 files)
- All tasks reference specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Non-blocking error handling ensures booking operations are never blocked by token invalidation failures
- All new code follows Cal.com conventions: `select` over `include`, `ErrorWithCode` for services, type-safe imports
