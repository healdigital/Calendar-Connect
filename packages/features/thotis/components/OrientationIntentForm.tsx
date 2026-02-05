"use client";

import { Button } from "@calcom/ui/components/button";
import { Label } from "@calcom/ui/components/form/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@calcom/ui/components/form/select";
import { Icon } from "@calcom/ui/components/icon";
import { useState } from "react";

// Need to check where AcademicField enum is available for frontend,
// usually imported from client-side types or manually defined if not exposed.
// For now, hardcoding common fields based on known fields.
const fields = [
  "MEDICINE",
  "LAW",
  "ENGINEERING",
  "COMPUTER_SCIENCE",
  "BUSINESS",
  "PSYCHOLOGY",
  "POLITICAL_SCIENCE",
  "ECONOMICS",
  "ARTS",
  "LANGUAGES",
] as const;

interface OrientationIntentFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function OrientationIntentForm({ onSubmit, isLoading }: OrientationIntentFormProps) {
  const [field, setField] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [zone, setZone] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      targetFields: field ? [field] : [],
      academicLevel: level,
      zone: zone,
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 mx-auto max-w-4xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Icon name="compass" className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-900">Find your perfect match</h3>
          <p className="text-sm text-gray-500">Tell us what you're looking for</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <Label>Target Field</Label>
          <Select onValueChange={setField} value={field}>
            <SelectTrigger>
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {fields.map((f) => (
                <SelectItem key={f} value={f}>
                  {f.charAt(0) + f.slice(1).toLowerCase().replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Academic Level</Label>
          <Select onValueChange={setLevel} value={level}>
            <SelectTrigger>
              <SelectValue placeholder="Your level..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TERMINALE">High School (Terminale)</SelectItem>
              <SelectItem value="PREPA">Preparatory Class</SelectItem>
              <SelectItem value="BACHELOR">Bachelor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Zone / Region</Label>
          {/* Using simple Input for now, could be a select later */}
          <input
            type="text"
            className="flex h-9 w-full rounded-md border border-default bg-default px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g. Paris, Remote"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          />
        </div>

        <Button type="submit" loading={isLoading} className="w-full" variant="default">
          Find Mentors
        </Button>
      </form>
    </div>
  );
}
