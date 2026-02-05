import { useLocale } from "@calcom/lib/hooks/useLocale";
import classNames from "@calcom/ui/classNames";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useCallback, useState } from "react";
import type { StudentProfileWithUser } from "./ProfileCard";
import { ProfileCard } from "./ProfileCard";

type ViewMode = "grid" | "list";

type SortOption = "rating" | "sessions" | "recent";

interface MentorListViewProps {
  profiles: StudentProfileWithUser[];
  isLoading: boolean;
  total: number;
  onBookSession: (username: string) => void;
}

export const MentorListView = ({ profiles, isLoading, total, onBookSession }: MentorListViewProps) => {
  const { t } = useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("rating");

  const sortedProfiles = useCallback(() => {
    const sorted = [...profiles];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => {
          const ratingA = Number(a.averageRating) || 0;
          const ratingB = Number(b.averageRating) || 0;
          return ratingB - ratingA;
        });
        break;
      case "sessions":
        sorted.sort((a, b) => (b.totalSessions || 0) - (a.totalSessions || 0));
        break;
      case "recent":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return sorted;
  }, [profiles, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-emphasis h-12 w-12 animate-spin rounded-full border-b-2 border-t-2" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="bg-default border-subtle rounded-lg border py-16 text-center shadow-sm">
        <Icon name="users" className="text-subtle mx-auto mb-4 h-12 w-12" />
        <h3 className="text-emphasis mb-2 text-lg font-medium">{t("thotis_no_mentors_found")}</h3>
        <p className="text-subtle">{t("thotis_no_mentors_found_desc")}</p>
      </div>
    );
  }

  const sorted = sortedProfiles();

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-subtle text-sm">{t("thotis_mentors_count", { count: total })}</p>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-subtle text-xs">
              {t("thotis_sort_by")}:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border-subtle bg-default text-emphasis rounded-md border px-2 py-1 text-xs">
              <option value="rating">{t("thotis_sort_rating")}</option>
              <option value="sessions">{t("thotis_sort_sessions")}</option>
              <option value="recent">{t("thotis_sort_recent")}</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="border-subtle flex rounded-md border">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={classNames(
                "rounded-l-md px-2 py-1",
                viewMode === "grid" ? "bg-emphasis text-inverted" : "text-subtle hover:bg-muted"
              )}
              title={t("thotis_grid_view")}>
              <Icon name="layout-grid" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={classNames(
                "rounded-r-md px-2 py-1",
                viewMode === "list" ? "bg-emphasis text-inverted" : "text-subtle hover:bg-muted"
              )}
              title={t("thotis_list_view")}>
              <Icon name="list" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((student) => (
            <ProfileCard
              key={student.id}
              student={student}
              onBookSession={() => student.user.username && onBookSession(student.user.username)}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {sorted.map((student) => (
            <MentorListItem
              key={student.id}
              student={student}
              onBookSession={() => student.user.username && onBookSession(student.user.username)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** Compact list row for a mentor */
const MentorListItem = ({
  student,
  onBookSession,
}: {
  student: StudentProfileWithUser;
  onBookSession: () => void;
}) => {
  const { t } = useLocale();
  const rating = Number(student.averageRating) || 0;
  const formattedRating = rating.toFixed(1).replace(/\.0$/, "");

  return (
    <div className="bg-default border-subtle flex items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-subtle flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold">
          {student.user.name?.charAt(0)?.toUpperCase() || "M"}
        </div>
        <div>
          <h3 className="text-emphasis text-sm font-semibold">{student.user.name || t("thotis_mentor")}</h3>
          <div className="text-subtle flex flex-wrap items-center gap-2 text-xs">
            {student.university && <span>{student.university}</span>}
            {student.degree && (
              <>
                <span className="text-subtle/50">&middot;</span>
                <span>{student.degree}</span>
              </>
            )}
            {student.field && (
              <>
                <span className="text-subtle/50">&middot;</span>
                <span>{student.field}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Icon name="star" className="h-4 w-4 fill-orange-400 text-orange-400" />
          <span className="text-emphasis text-sm font-medium">{formattedRating}</span>
          <span className="text-subtle text-xs">({student.totalRatings || 0})</span>
        </div>
        <Button color="primary" size="sm" onClick={onBookSession} EndIcon="arrow-right">
          {t("thotis_book_session")}
        </Button>
      </div>
    </div>
  );
};
