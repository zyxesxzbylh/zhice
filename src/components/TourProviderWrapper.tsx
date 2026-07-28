"use client";

import { GuidedTourProvider } from "@/components/GuidedTour";

export function TourProviderWrapper({ children }: { children: React.ReactNode }) {
  return <GuidedTourProvider>{children}</GuidedTourProvider>;
}
