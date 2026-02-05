import type { Dayjs } from "@calcom/dayjs";
import dayjs from "@calcom/dayjs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingWidget } from "./BookingWidget";

// Mock dependencies
vi.mock("@calcom/features/calendars/components/DatePicker", () => ({
  DatePicker: ({ onChange }: { onChange: (date: Dayjs | null) => void }) => (
    <button data-testid="mock-date-picker" onClick={() => onChange(dayjs("2024-01-01T10:00:00Z"))}>
      Select Date
    </button>
  ),
}));

// Mock TRPC
const mockMutate = vi.fn();
vi.mock("@calcom/trpc/react", () => ({
  trpc: {
    thotis: {
      createStudentSession: {
        useMutation: vi.fn((opts) => ({
          mutate: (variables: any, mutateOpts: any) => {
            // Combine hook options and mutate options
            // In component we call mutate(variables). mutateOpts works if passed.
            // Crucially we need 'opts' (hook options) where onSuccess is defined.
            const finalOpts = { ...opts, ...mutateOpts };
            mockMutate(variables, finalOpts);
          },
          isLoading: false,
        })),
      },
    },
  },
}));

vi.mock("@calcom/lib/hooks/useLocale", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

describe("BookingWidget Property Tests", () => {
  const originalLocation = window.location;
  const originalPostMessage = window.parent.postMessage;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location mock
    // @ts-expect-error
    delete window.location;
    window.location = { ...originalLocation, search: "" } as Location;
    // Mock postMessage
    window.parent.postMessage = vi.fn();

    // Mock ResizeObserver
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    // @ts-expect-error
    window.ResizeObserver = MockResizeObserver;

    // Reset mockMutate implementation to default
    mockMutate.mockImplementation(
      ({ studentId, startTime, studentEmail, studentName, notes }, { onSuccess }) => {
        // Simulate success by default if not overridden
      }
    );
  });

  afterEach(() => {
    window.location = originalLocation;
    window.parent.postMessage = originalPostMessage;
  });

  /**
   * Property 25: Widget PostMessage Communication
   * Validates: Requirements 9.3
   */
  it("should send postMessage on successful booking", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }),
        fc
          .string({ minLength: 1 })
          .filter((s) => s.trim().length > 0), // Ensure non-empty name (trimmed)
        fc.emailAddress(), // Ensure valid email
        fc.string(),
        fc.integer({ min: 1 }),
        fc.webUrl(),
        async (studentId, name, email, notes, bookingId, meetLink) => {
          // Arrange
          vi.clearAllMocks();
          const postMessageSpy = vi.spyOn(window.parent, "postMessage");

          // Mock successful mutation
          mockMutate.mockImplementation((variables, options) => {
            options?.onSuccess({ id: bookingId, googleMeetLink: meetLink });
          });

          render(<BookingWidget studentId={studentId} />);

          // Act: Step 1 - Select Date
          fireEvent.click(screen.getByTestId("mock-date-picker"));

          // Act: Step 2 - Select Time
          const timeButton = await screen.findByText("09:00");
          fireEvent.click(timeButton);

          // Act: Step 3 - Fill Form
          const nameInput = screen.getByLabelText(/Name/i);
          fireEvent.change(nameInput, { target: { value: name } });

          const emailInput = screen.getByLabelText(/Email/i);
          fireEvent.change(emailInput, { target: { value: email } });

          const notesInput = screen.getByLabelText(/Notes/i);
          fireEvent.change(notesInput, { target: { value: notes } });

          fireEvent.click(screen.getByText("thotis_confirm_booking"));

          // Assert
          await waitFor(() => {
            expect(postMessageSpy).toHaveBeenCalledWith(
              expect.objectContaining({
                type: "THOTIS_BOOKING_SUCCESS",
                bookingId: bookingId,
                googleMeetLink: meetLink,
              }),
              "*"
            );
          });
        }
      ),
      { numRuns: 10 } // Fast property test
    );
  });

  /**
   * Property 26: URL Parameter Pre-filling
   * Validates: Requirements 9.5
   */
  it("should pre-fill form fields from URL parameters", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), fc.emailAddress(), async (nameVal, emailVal) => {
        // Arrange
        vi.clearAllMocks();

        // Mock URL params (Mocking window.location properly)
        const url = new URL("http://localhost");
        url.searchParams.set("name", nameVal);
        url.searchParams.set("email", emailVal);

        // @ts-expect-error
        delete window.location;
        window.location = url as unknown as Location;

        // Act
        const { unmount } = render(<BookingWidget />);

        // Navigate to form
        fireEvent.click(screen.getByTestId("mock-date-picker"));
        const timeButton = await screen.findByText("09:00");
        fireEvent.click(timeButton);

        // Assert
        await waitFor(() => {
          const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
          const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
          expect(nameInput.value).toBe(nameVal);
          expect(emailInput.value).toBe(emailVal);
        });

        unmount();
      }),
      { numRuns: 10 }
    );
  });
});
