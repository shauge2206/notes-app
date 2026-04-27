"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Palette,
  ChevronsRight,
  LogOut,
  Settings,
  Keyboard,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { createFocusZone, updateFocusZone, deleteFocusZone } from "@/app/actions/focus-zones";
import { TILE_COLORS, getTileColor } from "@/lib/tile-colors";
import { SidebarFilters } from "@/components/sidebar-filters";
import type { FocusZone } from "@/lib/types";
import type { TagCount } from "@/lib/queries/tags";

interface Props {
  zones: FocusZone[];
  tags: TagCount[];
}

export function Sidebar({ zones, tags }: Props) {
  const [open, setOpen] = useState(true);
  const [creatingZone, setCreatingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeZone = searchParams.get("zone");
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
  }

  function handleZoneClick(zoneId: string | null) {
    if (zoneId) {
      router.push(`/?zone=${zoneId}`);
    } else {
      router.push("/");
    }
  }

  async function handleCreateZone() {
    if (!newZoneName.trim()) return;
    const result = await createFocusZone({ name: newZoneName.trim() });
    if (result.ok) {
      setNewZoneName("");
      setCreatingZone(false);
    } else {
      toast.error(result.error);
    }
  }

  async function handleDeleteZone(id: string) {
    const result = await deleteFocusZone(id);
    if (result.ok) {
      if (activeZone === id) router.push("/");
    } else {
      toast.error(result.error);
    }
  }

  async function handleRenameZone(zone: FocusZone) {
    const name = prompt("Nytt navn:", zone.name);
    if (!name || name === zone.name) return;
    const result = await updateFocusZone(zone.id, { name });
    if (!result.ok) toast.error(result.error);
  }

  async function handleColorZone(zoneId: string, color: string) {
    const result = await updateFocusZone(zoneId, { color });
    if (!result.ok) toast.error(result.error);
  }

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${
        open ? "w-64" : "w-16"
      } border-border bg-card p-2 flex flex-col`}
    >
      {/* Title / Logo */}
      <div className="mb-4 border-b border-border pb-3">
        <div className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-accent/50">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            {open && (
              <div>
                <span className="block text-sm font-semibold">Notes</span>
                <span className="block text-[11px] text-muted-foreground">Workspace</span>
              </div>
            )}
          </div>
          {open && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-1 flex-1 overflow-y-auto">
        {/* All zones */}
        <SidebarOption
          icon={<LayoutDashboard className="h-4 w-4" />}
          title="Alle Focus Zones"
          selected={!activeZone}
          onClick={() => handleZoneClick(null)}
          open={open}
        />

        {/* Focus Zones section */}
        {open && zones.length > 0 && (
          <div className="px-3 pt-4 pb-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Focus Zones
            </span>
          </div>
        )}

        {zones.map((zone) => {
          const color = getTileColor(zone.color);
          const isActive = activeZone === zone.id;

          return (
            <div key={zone.id} className="group relative">
              <button
                onClick={() => handleZoneClick(zone.id)}
                className={`relative flex h-10 w-full items-center rounded-md transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="w-3" />
                {open && (
                  <span className="text-sm font-medium truncate pr-8">{zone.name}</span>
                )}
              </button>

              {/* Zone options */}
              {open && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="p-1 rounded hover:bg-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => handleRenameZone(zone)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Gi nytt navn
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Palette className="w-4 h-4 mr-2" />
                          Farge
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <div className="flex gap-1.5 p-2">
                            {TILE_COLORS.map((c) => (
                              <button
                                key={c}
                                onClick={() => handleColorZone(zone.id, c)}
                                className={`w-5 h-5 rounded-full ${getTileColor(c).accent} ${
                                  zone.color === c ? "ring-2 ring-white ring-offset-1 ring-offset-background" : ""
                                } transition-transform hover:scale-110`}
                              />
                            ))}
                          </div>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteZone(zone.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Slett
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          );
        })}

        {/* Create zone */}
        {open && (
          <div className="px-2 pt-1">
            {creatingZone ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateZone();
                }}
                className="px-1"
              >
                <Input
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Navn..."
                  className="h-8 text-xs"
                  autoFocus
                  onBlur={() => {
                    if (!newZoneName.trim()) setCreatingZone(false);
                  }}
                />
              </form>
            ) : (
              <button
                className="flex h-10 w-full items-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                onClick={() => setCreatingZone(true)}
              >
                <div className="grid h-full w-12 place-content-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm">Ny Focus Zone</span>
              </button>
            )}
          </div>
        )}

        {/* Filters */}
        {open && (
          <div className="border-t border-border pt-3 mt-3">
            <SidebarFilters tags={tags} collapsed={!open} />
          </div>
        )}
      </div>

      {/* Account section */}
      {open && (
        <div className="border-t border-border pt-3 space-y-1">
          <SidebarOption
            icon={<Keyboard className="h-4 w-4" />}
            title="Snarveier"
            selected={false}
            onClick={() => window.dispatchEvent(new CustomEvent("open-shortcuts"))}
            open={open}
          />
          <SidebarOption
            icon={<Settings className="h-4 w-4" />}
            title="Innstillinger"
            selected={false}
            onClick={() => {}}
            open={open}
          />
          <SidebarOption
            icon={<LogOut className="h-4 w-4" />}
            title="Logg ut"
            selected={false}
            onClick={handleLogout}
            open={open}
            destructive
          />
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="mt-2 border-t border-border pt-2 transition-colors hover:bg-accent/50 rounded-md"
      >
        <div className="flex items-center p-2">
          <div className="grid size-8 place-content-center">
            <ChevronsRight
              className={`h-4 w-4 transition-transform duration-300 text-muted-foreground ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
          {open && (
            <span className="text-sm text-muted-foreground">Skjul</span>
          )}
        </div>
      </button>
    </nav>
  );
}

function SidebarOption({
  icon,
  title,
  selected,
  onClick,
  open,
  notifs,
  destructive,
}: {
  icon: React.ReactNode;
  title: string;
  selected: boolean;
  onClick: () => void;
  open: boolean;
  notifs?: number;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-10 w-full items-center gap-3 px-3 rounded-md transition-all duration-200 ${
        selected
          ? "bg-primary/10 text-primary border-l-2 border-primary shadow-sm"
          : destructive
            ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      }`}
    >
      <div className="shrink-0">
        {icon}
      </div>
      {open && (
        <span className="text-sm font-medium">{title}</span>
      )}
      {notifs && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
          {notifs}
        </span>
      )}
    </button>
  );
}
