"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Layers, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTile } from "@/app/actions/tiles";
import { TILE_COLORS, getTileColor } from "@/lib/tile-colors";
import { TagEditor } from "@/components/tag-editor";
import type { TileType, FocusZone } from "@/lib/types";

const SIZES = ["sm", "md", "lg"] as const;
const SIZE_LABELS: Record<string, string> = { sm: "S", md: "M", lg: "L" };

interface Props {
  zones: FocusZone[];
  defaultZoneId?: string;
  trigger?: React.ReactNode;
  allTags?: string[];
}

export function NewTileDialog({ zones, defaultZoneId, trigger, allTags = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<TileType | null>(null);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("blue");
  const [size, setSize] = useState("md");
  const [zoneId, setZoneId] = useState(defaultZoneId ?? "");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Listen for ⌘N shortcut
  useEffect(() => {
    function handleOpen() { setOpen(true); }
    window.addEventListener("open-new-tile", handleOpen);
    return () => window.removeEventListener("open-new-tile", handleOpen);
  }, []);

  function reset() {
    setStep(1);
    setType(null);
    setTitle("");
    setColor("blue");
    setSize("md");
    setZoneId(defaultZoneId ?? "");
    setTags([]);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function handleTypeSelect(t: TileType) {
    setType(t);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !title.trim()) return;

    setLoading(true);

    const result = await createTile({
      title: title.trim(),
      type,
      color,
      size,
      zone_id: zoneId || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    if (result.ok) {
      setOpen(false);
      reset();
      router.refresh();
      router.push(`/tile/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className={trigger ? "w-full h-full block appearance-none bg-transparent border-none p-0 m-0" : "inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"}>
        {trigger ?? (
          <>
            <Plus className="w-4 h-4" />
            Ny tile
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Velg type" : "Detaljer"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-2 gap-3 mt-2"
            >
              <button
                onClick={() => handleTypeSelect("checklist")}
                className="flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all hover:border-primary border-border"
              >
                <CheckSquare className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="font-semibold text-sm">Quick checklist</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enkel animert huskeliste. Perfekt for handlelister, pakking, daglige oppgaver.
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleTypeSelect("sections")}
                className="flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all hover:border-primary border-border"
              >
                <Layers className="w-8 h-8 text-violet-400" />
                <div>
                  <p className="font-semibold text-sm">Sections-dokument</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rikere prosjekt med navngitte seksjoner, rik tekst og bilder. Bra for pågående prosjekter.
                  </p>
                </div>
              </button>
              <p className="col-span-2 text-[11px] text-muted-foreground text-center mt-1">
                Tile-typen kan ikke endres etter opprettelse.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
            >
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="tile-title">Tittel</Label>
                  <Input
                    id="tile-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Gi tile-en et navn..."
                    required
                    autoFocus
                  />
                </div>

                {/* Focus Zone */}
                {zones.length > 0 && (
                  <div className="space-y-2">
                    <Label>Focus Zone</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setZoneId("")}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                          !zoneId
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Ingen
                      </button>
                      {zones.map((z) => {
                        const zColor = getTileColor(z.color);
                        return (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => setZoneId(z.id)}
                            className={`text-xs px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 ${
                              zoneId === z.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${zColor.accent}`} />
                            {z.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color */}
                <div className="space-y-2">
                  <Label>Farge</Label>
                  <div className="flex gap-2">
                    {TILE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full ${getTileColor(c).accent} transition-transform hover:scale-110 ${
                          color === c
                            ? "ring-2 ring-white ring-offset-2 ring-offset-background"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label>Størrelse</Label>
                  <div className="flex gap-1">
                    {SIZES.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant={size === s ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSize(s)}
                        className="w-10"
                      >
                        {SIZE_LABELS[s]}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagEditor tags={tags} onChange={setTags} suggestions={allTags} />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Tilbake
                  </Button>
                  <Button type="submit" size="sm" disabled={loading || !title.trim()}>
                    {loading ? "Oppretter..." : "Opprett"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
