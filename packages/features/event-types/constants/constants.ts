/**
 * DEFAULT_EVENT_TYPES
 *
 * Default event type configurations for new users
 */
export const DEFAULT_EVENT_TYPES = {
  thirtyMinutes: {
    title: "30 Minute Meeting",
    slug: "30min",
    length: 30,
  },
  sixtyMinutes: {
    title: "60 Minute Meeting",
    slug: "60min",
    length: 60,
  },
  thirtyMinutesVideo: {
    title: "30 Minute Video Meeting",
    slug: "30min-video",
    length: 30,
  },
  sixtyMinutesVideo: {
    title: "60 Minute Video Meeting",
    slug: "60min-video",
    length: 60,
  },
} as const;
