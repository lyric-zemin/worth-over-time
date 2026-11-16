"use client";

import dynamic from "next/dynamic";

const InsightsView = dynamic(
  () => import("@/components/insights/insights-view").then((module) => module.InsightsView),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-3xl bg-card/60" aria-hidden="true" /> },
);

export default function InsightsPage() {
  return <InsightsView />;
}
