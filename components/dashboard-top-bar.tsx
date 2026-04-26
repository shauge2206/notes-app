"use client";

import { SearchInput } from "@/components/search-input";

interface Props {
  activeZoneId?: string;
}

export function DashboardTopBar({ activeZoneId }: Props) {
  return (
    <div className="flex items-center gap-3 px-6 h-14 border-b border-border shrink-0">
      <SearchInput activeZoneId={activeZoneId} />
    </div>
  );
}
