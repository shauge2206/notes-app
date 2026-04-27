"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  saving: boolean;
}

export function SavedIndicator({ saving }: Props) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 mr-2">
      <AnimatePresence mode="wait">
        {saving ? (
          <motion.span
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1"
          >
            <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
            Lagrer...
          </motion.span>
        ) : (
          <motion.span
            key="saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1"
          >
            <Check className="w-3 h-3 text-emerald-400" />
            Lagret
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
