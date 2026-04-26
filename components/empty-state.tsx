"use client";

import { motion } from "framer-motion";
import { LayoutDashboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NewTileDialog } from "@/components/new-tile-dialog";
import type { FocusZone } from "@/lib/types";

interface Props {
  zones: FocusZone[];
  activeZoneId?: string;
}

export function EmptyState({ zones, activeZoneId }: Props) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-sm text-center">
          <CardContent className="flex flex-col items-center gap-4 py-10 px-8">
            <LayoutDashboard className="w-10 h-10 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Arbeidsområdet er tomt</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Opprett din første tile for å komme i gang.
              </p>
            </div>
            <NewTileDialog zones={zones} defaultZoneId={activeZoneId} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
