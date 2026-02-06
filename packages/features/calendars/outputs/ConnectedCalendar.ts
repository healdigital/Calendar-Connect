import type { IntegrationCalendar } from "@calcom/types/Calendar";

export type Calendar = IntegrationCalendar & {
  readOnly: boolean;
  credentialId: number;
  primary: boolean | null;
  isSelected: boolean;
  integration: string;
  externalId: string;
  email?: string;
  name?: string;
  delegationCredentialId?: number | null;
};

export type ConnectedCalendar = {
  integration: {
    installed: boolean;
    type: string;
    title: string;
    name: string;
    description: string;
    variant: string;
    slug: string;
    locationOption: unknown;
    categories: string[];
    logo: string;
    publisher: string;
    url: string;
    email: string;
  };
  credentialId: number;
  primary?: Calendar;
  calendars?: Calendar[];
  error?: {
    message: string;
  };
};
