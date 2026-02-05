"use client";

import { ErrorBoundary } from "@calcom/ui/components/errorBoundary";
import { Icon } from "@calcom/ui/components/icon";
import type React from "react";
import { Suspense } from "react";

export default function TroubleshooterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-1 *:flex-1">
        <ErrorBoundary>
          <Suspense fallback={<Icon name="loader" />}>{children}</Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}
