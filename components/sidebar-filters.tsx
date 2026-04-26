"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pin, CheckSquare, Layers, Tag } from "lucide-react";
import type { TagCount } from "@/lib/queries/tags";

interface Props {
  tags: TagCount[];
  collapsed: boolean;
}

export function SidebarFilters({ tags, collapsed }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTag = searchParams.get("tag");
  const isPinned = searchParams.get("pinned") === "1";
  const activeType = searchParams.get("type");

  function toggleParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  if (collapsed) return null;

  return (
    <div className="px-3 py-2 space-y-3">
      {/* Type & pinned filters */}
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">
          Filter
        </p>
        <FilterButton
          active={isPinned}
          onClick={() => toggleParam("pinned", "1")}
          icon={<Pin className="w-3.5 h-3.5" />}
          label="Kun festede"
        />
        <FilterButton
          active={activeType === "checklist"}
          onClick={() => toggleParam("type", "checklist")}
          icon={<CheckSquare className="w-3.5 h-3.5" />}
          label="Sjekklister"
        />
        <FilterButton
          active={activeType === "sections"}
          onClick={() => toggleParam("type", "sections")}
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Seksjoner"
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">
            Tags
          </p>
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => toggleParam("tag", tag)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                activeTag === tag
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Tag className="w-3 h-3 shrink-0" />
              <span className="truncate flex-1 text-left">#{tag}</span>
              <span className="text-[10px] text-muted-foreground/50">{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
