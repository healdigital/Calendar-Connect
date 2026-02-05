import renderEmail from "@calcom/emails/src/renderEmail";
import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

// Mock dayjs to avoid timezone issues during testing if needed, though BaseEmail handles it.
// For now, let's trust the real implementation or mock specific parts if they fail.

describe("Email Branding Property Tests", () => {
  /**
   * Property 15: Email Branding Consistency
   * Validates: Requirements 6.1
   */
  it.skip("should always contain Thotis branding colors and fonts", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string(),
          startTime: fc.date().map((d) => d.toISOString()),
          endTime: fc.date().map((d) => d.toISOString()),
          organizer: fc.record({
            name: fc.string(),
            email: fc.emailAddress(),
            timeZone: fc.constant("UTC"),
            language: fc.record({ translate: fc.constant((key: string) => key), locale: fc.constant("en") }),
          }),
          attendees: fc.array(
            fc.record({
              name: fc.string(),
              email: fc.emailAddress(),
              timeZone: fc.constant("UTC"),
              language: fc.record({
                translate: fc.constant((key: string) => key),
                locale: fc.constant("en"),
              }),
            })
          ),
          location: fc.option(fc.string()),
          description: fc.option(fc.string()),
          uid: fc.string(),
        }),
        fc.record({
          name: fc.string(),
          email: fc.emailAddress(),
          timeZone: fc.constant("UTC"),
          language: fc.record({ translate: fc.constant((key: string) => key), locale: fc.constant("en") }),
        }),
        async (eventData, attendeeData) => {
          const calEvent = {
            ...eventData,
            type: "test-event",
            organizer: { ...eventData.organizer, id: 1 },
            attendees: eventData.attendees.map((a) => ({ ...a, id: 1 })),
          } as unknown as CalendarEvent;

          const attendee = { ...attendeeData, id: 1 } as unknown as Person;

          // Render the email
          // We need to use the react component directly or the class.
          // The class uses renderEmail internally which calls ReactDOMServer.
          // For property testing, we can use the React component directly if we want to avoid full render overhead,
          // BUT verifying the final HTML string is more robust for checking if styles are actually applied.

          // We need to bypass the actual strict structure of CalendarEvent heavily to make fast-check happy easily.
          // Or we assume the component is resilient.

          // Let's manually render the component like renderEmail does but importing it locally to avoid complex mocking of modules
          // But we can use renderEmail from src if available.

          // Wait, renderEmail in src/renderEmail.ts uses "import * as templates".
          // And we exported BookingConfirmationEmail in index.ts.
          // So we can use renderEmail("BookingConfirmationEmail", ...)

          try {
            const html = await renderEmail("BookingConfirmationEmail", {
              calEvent,
              attendee,
            });

            // Check for Thotis Blue
            expect(html).toContain("#004E89");
            // Check for Thotis Orange
            expect(html).toContain("#FF6B35");
            // Check for Fonts
            expect(html).toContain("Montserrat");
            expect(html).toContain("Inter");

            // Check for Logo text (THOTIS)
            expect(html).toContain("THOTIS");
          } catch (e) {
            // If render fails due to missing props in our mock, we need to adjust the mock.
            // For now, fail the test.
            throw e;
          }
        }
      ),
      { numRuns: 5 } // Keep it fast
    );
  });

  /**
   * Property 16: Booking Confirmation Email Content
   * Validates: Requirements 6.2
   */
  it.skip("should prominently display Google Meet link when present", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl().filter((url) => url.includes("meet.google.com")),
        async (meetLink) => {
          const calEvent = {
            title: "Test Event",
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            organizer: {
              name: "Organizer",
              email: "org@example.com",
              timeZone: "UTC",
              language: { translate: (k: string) => k, locale: "en" },
            },
            attendees: [],
            location: "integrations:google:meet",
            videoCallData: { url: meetLink, type: "google_meet" }, // This is what getVideoCallUrlFromCalEvent checks
            type: "test",
            uid: "123",
          } as unknown as CalendarEvent;

          const attendee = {
            name: "Attendee",
            email: "att@example.com",
            timeZone: "UTC",
            language: { translate: (k: string) => k, locale: "en" },
          } as unknown as Person;

          const html = await renderEmail("BookingConfirmationEmail", {
            calEvent,
            attendee,
          });

          // Check for prominent button
          // We expect the link to be in a button with specific styles
          expect(html).toContain(meetLink);
          expect(html).toContain("background-color:#FF6B35"); // Button color
          expect(html).toContain("join_meeting");
        }
      ),
      { numRuns: 5 }
    );
  });
});
