// --- Types & Interfaces ---

export interface Mentor {
  id: string;
  university: string;
  field: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageRating: number | null;
}

// --- Utilities ---

export const generateCSV = (data: Mentor[]): string => {
  if (!data || data.length === 0) return "";

  const headers = ["University", "Field", "Sessions", "Rating", "Completion Rate"];
  const rows = data.map((profile) => {
    const rate =
      profile.totalSessions > 0
        ? Math.round((profile.completedSessions / profile.totalSessions) * 100) + "%"
        : "0%";

    // Escape quotes in strings
    const university = profile.university ? profile.university.replace(/"/g, '""') : "";
    const field = profile.field ? profile.field.replace(/"/g, '""') : "";

    return [
      `"${university}"`,
      `"${field}"`,
      profile.totalSessions,
      profile.averageRating?.toFixed(1) || "",
      `"${rate}"`,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
};
