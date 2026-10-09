"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { curtain } from "@/lib/motion/tokens";

// Set after the first route has mounted, so the curtain only plays on navigation.
let hasMounted = false;

/**
 * Signature move 5: the curtain. Templates remount on every navigation, so the
 * new page renders underneath while an obsidian curtain with the monogram lifts away.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const [isFirst] = useState(() => !hasMounted);
  const reduced = useReducedMotion();

  useEffect(() => {
    hasMounted = true;
  }, []);

  return (
    <>
      {children}
      {!isFirst && !reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[90] grid place-items-center bg-night"
          variants={curtain}
          initial="covered"
          animate="lifted"
        >
          <Monogram className="h-12 w-12" />
        </motion.div>
      )}
    </>
  );
}
