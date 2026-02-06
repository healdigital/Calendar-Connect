import { expect, test } from "@playwright/test";
import { uuid } from "short-uuid";

test.describe("Thotis Guest Journey E2E", () => {
  test("should complete guest booking -> reschedule -> join flow", async ({ page }) => {
    // 1. Visit Thotis Landing
    await page.goto("/thotis");
    await page.click("text=Find a Mentor");

    // 2. Select a Mentor
    await page.waitForSelector('[data-testid="mentor-card"]');
    await page.click('[data-testid="mentor-card"]');

    // 3. Select a slot (BookingWidget)
    await page.waitForSelector('[data-testid="available-slot"]');
    await page.click('[data-testid="available-slot"]');

    // 4. Fill details
    await page.fill('input[name="name"]', "Test Student");
    await page.fill('input[name="email"]', `e2e-${uuid()}@example.com`); // Use uuid for unique email
    await page.click('[data-testid="confirm-booking"]');

    // 5. Success check
    await expect(page.locator("text=Booking Confirmed")).toBeVisible();

    // 6. Access Student Inbox via email link (simulated)
    // We'll go to the inbox page directly if we can generate the token or use a mock
    // For now, let's verify the success page has the necessary info
    await expect(page.locator('[data-testid="meet-link"]')).toBeVisible();

    // 5. Reschedule
    await page.click('[data-testid="reschedule-button"]');
    await page.click('[data-testid="available-slot"]:last-child');
    await page.click('[data-testid="confirm-reschedule"]');

    await expect(page.locator("text=Rescheduled successfully")).toBeVisible();

    // 6. Verify unified link
    const link = await page.getAttribute('[data-testid="meet-link"]', "href");
    expect(link).toMatch(/meet\.(google|jit\.si)/);
  });
});
