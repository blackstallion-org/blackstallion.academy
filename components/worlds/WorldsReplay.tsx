"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { INTRO_REVEAL_KEY, markIntroSeen } from "@/lib/opening/intro-boot";
import { FourWorlds } from "./FourWorlds";

/**
 * /worlds: the intro film as a page of its own (a replay). It plays by itself; when it ends, or is skipped, the homepage comes up
 * from black. Reduced motion or no WebGL 2 shows the four stills with the credits instead.
 */
export function WorldsReplay() {
  const router = useRouter();
  const done = useCallback(() => {
    markIntroSeen();
    try { sessionStorage.setItem(INTRO_REVEAL_KEY, "1"); } catch {}
    router.push("/");
  }, [router]);
  return <FourWorlds mode="page" onDone={done} />;
}
