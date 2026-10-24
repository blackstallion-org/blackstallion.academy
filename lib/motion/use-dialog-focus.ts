"use client";

import { useEffect, type RefObject } from "react";

/** Keep keyboard focus within an existing modal, then return it to its opener. */
export function useDialogFocus(open: boolean, scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const dialog = scope.current?.querySelector<HTMLElement>('[aria-modal="true"]');
    if (!dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter((element) => element.getClientRects().length > 0);
    dialog.tabIndex = -1;
    (controls()[0] ?? dialog).focus({ preventScroll: true });
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0], last = items[items.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [open, scope]);
}
