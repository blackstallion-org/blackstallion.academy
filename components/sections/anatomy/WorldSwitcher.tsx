"use client";

import { useRef, type KeyboardEvent } from "react";
import { horseWorldsCopy, worldCopy, worldOrder, type WorldId } from "@/lib/content/horse-worlds";
import { cn } from "@/lib/utils";

type Props = {
  /** The place the visitor has asked for (it leads the scene on screen by the length of the fade). */
  value: WorldId;
  onChange: (world: WorldId) => void;
  /** A switch is under way; the buttons stay live (the newest request wins). */
  busy?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * The three places as three buttons: DESERT | HORSE FIELD | VILLAGE. A choice is made only by pressing one of them (never by
 * scrolling). The arrow keys, Home and End move between them; Enter and Space choose.
 */
export function WorldSwitcher({ value, onChange, busy = false, disabled = false, className }: Props) {
  const refs = useRef<Partial<Record<WorldId, HTMLButtonElement | null>>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = worldOrder.indexOf(value);
    const focused = worldOrder.find((id) => refs.current[id] === document.activeElement);
    const at = focused ? worldOrder.indexOf(focused) : i;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (at + 1) % worldOrder.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (at - 1 + worldOrder.length) % worldOrder.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = worldOrder.length - 1;
    if (next < 0) return;
    e.preventDefault();
    refs.current[worldOrder[next]]?.focus();
  };

  return (
    <div
      role="group"
      aria-label={horseWorldsCopy.groupLabel}
      aria-busy={busy}
      onKeyDown={onKeyDown}
      className={cn("flex items-center gap-1 rounded-full border border-line bg-night/80 p-1 backdrop-blur-md", className)}
    >
      {worldOrder.map((id) => {
        const on = id === value;
        return (
          <button
            key={id}
            ref={(el) => { refs.current[id] = el; }}
            type="button"
            data-world-option={id}
            aria-pressed={on}
            disabled={disabled}
            onClick={() => { if (!on) onChange(id); }}
            className={cn(
              "min-h-11 whitespace-nowrap rounded-full px-3.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors sm:px-5 sm:text-[0.66rem]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50",
              on ? "bg-gold text-night" : "text-sand hover:text-gold",
            )}
          >
            {worldCopy[id].label}
          </button>
        );
      })}
    </div>
  );
}
