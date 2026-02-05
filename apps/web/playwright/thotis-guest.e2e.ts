import { expect, test } from "@playwright/test";
import { uuid } from "short-uuid";

test.describe("Thotis Guest Journey E2E", () => {
  test("should complete guest booking -> reschedule -> join flow", async ({ page }) => {
    // 1. Visit Thotis landing/search page (assuming /thotis)
    await page.goto("/thotis");

    // 2. Click on a mentor (search results)
    // For E2E we assume a seeded mentor exists
    await page.click('[data-testid="mentor-card"]');

    // 3. Book a slot
    await page.click('[data-testid="available-slot"]');
    await page.fill('[name="name"]', "E2E Student");
    await page.fill('[name="email"]', `e2e-${uuid()}@example.com`);
    await page.click('[data-testid="confirm-booking"]');

    expect(page.url()).toContain("/thotis/success");
    await expect(page.locator("text=Booking confirmed")).toBeVisible();

    // 4. Access Student Inbox via email link (simulated)
    // We'll go to the inbox page directly if we can generate the token or use a mock
    // For now, let's verify the success page has the necessary info
    await expect(page.locator('[data-testid="meet-link"]')).not.toContainText("integrations:google-video");

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
