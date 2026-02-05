import type * as getTranslation from "@calcom/lib/server/i18n";
import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

vi.mock("@calcom/lib/server/i18n", () => getTranslationMock);

beforeEach(() => {
  mockReset(getTranslationMock);
});

const getTranslationMock = mockDeep<typeof getTranslation>();

export const mock = {
  fakeIdentityFn: () =>
    getTranslationMock.getTranslation.mockImplementation(async () => (key: string) => key),
};

export default getTranslationMock;
