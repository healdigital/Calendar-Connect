"use client";

import { Button } from "@calcom/ui/components/button";
import { Label, Select } from "@calcom/ui/components/form";
import { Icon } from "@calcom/ui/components/icon";
import { useState } from "react";

// Need to check where AcademicField enum is available for frontend,
// usually imported from client-side types or manually defined if not exposed.
// For now, hardcoding common fields based on known fields.
const fields = [
  { value: "MEDICINE", label: "Medicine" },
  { value: "LAW", label: "Law" },
  { value: "ENGINEERING", label: "Engineering" },
  { value: "COMPUTER_SCIENCE", label: "Computer Science" },
  { value: "BUSINESS", label: "Business" },
  { value: "PSYCHOLOGY", label: "Psychology" },
  { value: "POLITICAL_SCIENCE", label: "Political Science" },
  { value: "ECONOMICS", label: "Economics" },
  { value: "ARTS", label: "Arts" },
  { value: "LANGUAGES", label: "Languages" },
  { value: "EDUCATION", label: "Education" },
  { value: "SCIENCES", label: "Sciences" },
  { value: "OTHER", label: "Other" },
];

interface OrientationIntentFormProps {
  onSubmit: (data: any) => void;
  isPending?: boolean;
}

const goalsOptions = [
  "Parcoursup help",
  "Career advice",
  "University choice",
  "Internship/Alternance",
  "Student life",
  "International mobility",
] as const;

const scheduleOptions = [
  { id: "weekdays", label: "Weekdays" },
  { id: "weekends", label: "Weekends" },
  { id: "evenings", label: "Evenings" },
] as const;

export function OrientationIntentForm({ onSubmit, isPending }: OrientationIntentFormProps) {
  const [field, setField] = useState<{ value: string; label: string } | null>(null);
  const [level, setLevel] = useState<{ value: string; label: string } | null>(null);
  const [zone, setZone] = useState<string>("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  };

  const toggleSchedule = (id: string) => {
    setSelectedSchedules((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      targetFields: field ? [field.value] : [],
      academicLevel: level?.value || "",
      zone: zone,
      goals: selectedGoals,
      scheduleConstraints: {
        preferredTimes: selectedSchedules,
      },
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 mx-auto max-w-4xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Icon name="search" className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-900">Find your perfect match</h3>
          <p className="text-sm text-gray-500">Tell us what you're looking for</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Target Field</Label>
            <Select
              options={fields}
              value={field}
              onChange={(val) => setField(val)}
              placeholder="Select field..."
            />
          </div>

          <div className="space-y-2">
            <Label>Academic Level</Label>
            <Select
              options={[
                { value: "TERMINALE", label: "High School (Terminale)" },
                { value: "PREPA", label: "Preparatory Class" },
                { value: "BACHELOR", label: "Bachelor" },
              ]}
              value={level}
              onChange={(val) => setLevel(val)}
              placeholder="Your level..."
            />
          </div>

          <div className="space-y-2">
            <Label>Zone / Region</Label>
            <input
              type="text"
              className="flex h-9 w-full rounded-md border border-default bg-default px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g. Paris, Remote"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Goals</Label>
            <div className="flex flex-wrap gap-2">
              {goalsOptions.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    selectedGoals.includes(goal)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400"
                  }`}>
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Schedule Preference</Label>
            <div className="flex gap-4">
              {scheduleOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSchedules.includes(opt.id)}
                    onChange={() => toggleSchedule(opt.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" loading={isPending} className="w-full" size="lg">
          Find Mentors
        </Button>
      </form>
    </div>
  );
}
