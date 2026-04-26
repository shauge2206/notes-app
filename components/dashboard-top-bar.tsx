"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NewTileDialog } from "@/components/new-tile-dialog";
import type { FocusZone } from "@/lib/types";

interface Props {
  zones: FocusZone[];
  activeZoneId?: string;
}

export function DashboardTopBar({ zones, activeZoneId }: Props) {
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleSearch(value: string) {
    setQuery(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      if (activeZoneId) params.set("zone", activeZoneId);
      router.replace(`/?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-3 px-6 h-14 border-b border-border shrink-0">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Søk i tiles..."
          className="pl-8 h-9"
        />
      </div>
      <NewTileDialog zones={zones} defaultZoneId={activeZoneId} />
    </div>
  );
}
