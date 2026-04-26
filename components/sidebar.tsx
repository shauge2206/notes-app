"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Plus,
  Circle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
import type { FocusZone } from "@/lib/types";

interface Props {
  zones: FocusZone[];
}

export function Sidebar({ zones }: Props) {
  const [collapsed, setCollapsed] = useState(false);
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
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col border-r border-border bg-card shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <LayoutDashboard className="w-5 h-5 text-primary shrink-0" />
        {!collapsed && (
          <span className="text-sm font-semibold text-foreground truncate">
            Notes
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto shrink-0 w-8 h-8"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Zones */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* All tiles */}
        <button
          onClick={() => handleZoneClick(null)}
          className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
            !activeZone
              ? "text-foreground bg-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">Alle tiles</span>}
        </button>

        {!collapsed && zones.length > 0 && (
          <div className="px-4 pt-4 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Focus Zones
            </span>
          </div>
        )}

        {zones.map((zone) => {
          const color = getTileColor(zone.color);
          const isActive = activeZone === zone.id;

          return (
            <div
              key={zone.id}
              className={`group flex items-center gap-2.5 px-4 py-2 transition-colors cursor-pointer ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={isActive ? { backgroundColor: `color-mix(in srgb, var(--accent) 60%, transparent)` } : undefined}
              onClick={() => handleZoneClick(zone.id)}
            >
              <Circle
                className={`w-3 h-3 shrink-0 ${color.accent} rounded-full`}
                fill="currentColor"
                style={{ color: `var(--tw-bg-opacity, 1)` }}
              />
              {!collapsed && (
                <>
                  <span className="text-sm truncate flex-1">{zone.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
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
                </>
              )}
            </div>
          );
        })}

        {/* Create zone */}
        {!collapsed && (
          <div className="px-3 pt-2">
            {creatingZone ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateZone();
                }}
                className="flex gap-1"
              >
                <Input
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Navn..."
                  className="h-7 text-xs"
                  autoFocus
                  onBlur={() => {
                    if (!newZoneName.trim()) setCreatingZone(false);
                  }}
                />
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-1.5 text-xs text-muted-foreground"
                onClick={() => setCreatingZone(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Ny Focus Zone
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={`w-full ${collapsed ? "justify-center" : "justify-start gap-2"} text-muted-foreground hover:text-destructive`}
          onClick={handleLogout}
          title="Logg ut"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm">Logg ut</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
