import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useCallback, useState } from "react";

const ACADEMIC_FIELDS = [
  { value: "LAW", label: "thotis_field_law" },
  { value: "MEDICINE", label: "thotis_field_medicine" },
  { value: "ENGINEERING", label: "thotis_field_engineering" },
  { value: "BUSINESS", label: "thotis_field_business" },
  { value: "COMPUTER_SCIENCE", label: "thotis_field_computer_science" },
  { value: "PSYCHOLOGY", label: "thotis_field_psychology" },
  { value: "EDUCATION", label: "thotis_field_education" },
  { value: "ARTS", label: "thotis_field_arts" },
  { value: "SCIENCES", label: "thotis_field_sciences" },
  { value: "OTHER", label: "thotis_field_other" },
] as const;

const RATING_OPTIONS = [
  { value: 0, label: "thotis_any_rating" },
  { value: 3, label: 3 },
  { value: 4, label: 4 },
  { value: 4.5, label: 4.5 },
] as const;

export interface MentorSearchFiltersState {
  fieldOfStudy: string;
  university: string;
  minRating: number;
}

interface MentorSearchFiltersProps {
  filters: MentorSearchFiltersState;
  onFiltersChange: (filters: MentorSearchFiltersState) => void;
}

export const MentorSearchFilters = ({ filters, onFiltersChange }: MentorSearchFiltersProps) => {
  const { t } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: universities } = trpc.thotis.profile.universities.useQuery();

  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFiltersChange({ ...filters, fieldOfStudy: e.target.value });
    },
    [filters, onFiltersChange]
  );

  const handleUniversityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFiltersChange({ ...filters, university: e.target.value });
    },
    [filters, onFiltersChange]
  );

  const handleRatingChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFiltersChange({ ...filters, minRating: Number(e.target.value) });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({ fieldOfStudy: "", university: "", minRating: 0 });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.fieldOfStudy || filters.university || filters.minRating > 0;

  return (
    <div className="bg-default border-subtle rounded-lg border p-4">
      {/* Mobile toggle */}
      <button
        type="button"
        className="flex w-full items-center justify-between md:hidden"
        onClick={() => setIsExpanded(!isExpanded)}>
        <span className="text-emphasis text-sm font-medium">
          <Icon name="filter" className="mr-2 inline h-4 w-4" />
          {t("thotis_filter_by_field")}
          {hasActiveFilters && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">
              !
            </span>
          )}
        </span>
        <Icon name={isExpanded ? "chevron-up" : "chevron-down"} className="h-4 w-4" />
      </button>

      {/* Filter fields - always visible on desktop, toggled on mobile */}
      <div className={`${isExpanded ? "mt-4 block" : "hidden"} md:block`}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {/* Field of Study */}
          <div>
            <label htmlFor="filter-field" className="text-subtle mb-1 block text-xs font-medium">
              {t("thotis_filter_by_field")}
            </label>
            <select
              id="filter-field"
              value={filters.fieldOfStudy}
              onChange={handleFieldChange}
              className="border-subtle bg-default text-emphasis block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">{t("thotis_all_fields")}</option>
              {ACADEMIC_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>
                  {t(f.label)}
                </option>
              ))}
            </select>
          </div>

          {/* University */}
          <div>
            <label htmlFor="filter-university" className="text-subtle mb-1 block text-xs font-medium">
              {t("thotis_filter_by_university")}
            </label>
            <select
              id="filter-university"
              value={filters.university}
              onChange={handleUniversityChange}
              className="border-subtle bg-default text-emphasis block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">{t("thotis_all_universities")}</option>
              {universities?.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Rating */}
          <div>
            <label htmlFor="filter-rating" className="text-subtle mb-1 block text-xs font-medium">
              {t("thotis_min_rating")}
            </label>
            <select
              id="filter-rating"
              value={filters.minRating}
              onChange={handleRatingChange}
              className="border-subtle bg-default text-emphasis block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500">
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {typeof opt.label === "string"
                    ? t(opt.label)
                    : t("thotis_stars_plus", { count: opt.label })}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <Button color="minimal" size="sm" onClick={handleClearFilters} StartIcon="x">
                {t("thotis_clear_filters")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
