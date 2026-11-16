"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useLenis } from "lenis/react";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import type { ArchiveItem } from "@/lib/content/history/marwar-archive";
import { archiveSrc } from "@/lib/content/history/marwar";
import { useDialogFocus } from "@/lib/motion/use-dialog-focus";

const MIN = 1;
const MAX = 4;

/**
 * The archive viewer: one plate at full size with its whole record (catalogued title, holder and reference, licence, links).
 * Previous / next walk the plates of the same chapter. Zoom with the buttons, + / − / 0, the wheel or a double click; drag to
 * pan once zoomed (touch-action is released only while zoomed, so a phone still scrolls the record). Escape closes and
 * focus returns to the print that opened it. The full file is requested only when the viewer opens.
 */
export function ArchiveViewer({ items, index, plateOf, onClose, onIndex }: {
  items: ArchiveItem[];
  index: number;
  plateOf: (id: string) => number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const item = items[index];
  useDialogFocus(true, scope);

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const zoomBy = useCallback((k: number) => {
    setZoom((z) => {
      const next = Math.min(MAX, Math.max(MIN, +(z * k).toFixed(3)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);
  const go = useCallback((d: number) => {
    const i = index + d;
    if (i < 0 || i >= items.length) return;
    reset();
    onIndex(i);
  }, [index, items.length, onIndex, reset]);

  // the page stays still behind the viewer
  useEffect(() => {
    lenis?.stop();
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { lenis?.start(); document.documentElement.style.overflow = overflow; };
  }, [lenis]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") zoomBy(1.5);
      else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.5);
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [go, onClose, reset, zoomBy]);

  const onWheel = (e: React.WheelEvent) => { if (e.ctrlKey || zoom > 1 || e.deltaY < 0) zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15); };
  const down = (e: ReactPointerEvent) => {
    if (zoom === 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    setDragging(true);
  };
  const move = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x) / zoom, y: d.py + (e.clientY - d.y) / zoom });
  };
  const up = () => { drag.current = null; setDragging(false); };

  if (!item) return null;
  const isPhoto = item.kind === "photograph";

  return (
    <div ref={scope}>
      <div className="mw-viewer tone-dark" role="dialog" aria-modal="true" aria-label={`Plate ${plateOf(item.id)}: ${item.title}`}>
        <div
          className="mw-viewer-stage"
          data-zoomed={zoom > 1 || undefined}
          data-dragging={dragging || undefined}
          onWheel={onWheel}
          onDoubleClick={() => (zoom > 1 ? reset() : zoomBy(2))}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <div className="mw-viewer-img" style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}>
            <Image
              key={item.id}
              src={archiveSrc[item.id]}
              alt={item.alt}
              fill
              sizes="(min-width: 1024px) calc(100vw - 24rem), 100vw"
              quality={90}
              style={isPhoto ? { filter: "grayscale(1)" } : undefined}
              draggable={false}
            />
          </div>
          <div className="mw-viewer-top">
            <span className="mw-plate-line">Plate {String(plateOf(item.id)).padStart(2, "0")} · {index + 1} of {items.length} in this chapter</span>
            <button type="button" className="mw-round" onClick={onClose} aria-label="Close the viewer"><X size={18} strokeWidth={1.4} aria-hidden /></button>
          </div>
          <div className="mw-viewer-bar">
            <button type="button" className="mw-round" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous plate"><ChevronLeft size={18} strokeWidth={1.4} aria-hidden /></button>
            <button type="button" className="mw-round" onClick={() => zoomBy(1 / 1.5)} disabled={zoom <= MIN} aria-label="Zoom out"><Minus size={16} strokeWidth={1.4} aria-hidden /></button>
            <button type="button" className="mw-round" onClick={reset} disabled={zoom === 1} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
            <button type="button" className="mw-round" onClick={() => zoomBy(1.5)} disabled={zoom >= MAX} aria-label="Zoom in"><Plus size={16} strokeWidth={1.4} aria-hidden /></button>
            <button type="button" className="mw-round" onClick={() => go(1)} disabled={index === items.length - 1} aria-label="Next plate"><ChevronRight size={18} strokeWidth={1.4} aria-hidden /></button>
          </div>
        </div>

        <aside className="mw-viewer-meta" aria-label="The record">
          <span className="mw-tag" data-kind={item.kind}>{isPhoto ? "Archive photograph" : "Period painting"} · {item.date}</span>
          <h2>{item.title}</h2>
          <dl>
            <div><dt>Catalogued as</dt><dd>{item.catalogued}</dd></div>
            {item.identification && <div><dt>Who is shown</dt><dd>{item.identification}</dd></div>}
            {item.dateNote && <div><dt>Date</dt><dd>{item.date}. {item.dateNote}</dd></div>}
            <div><dt>By</dt><dd>{item.creator}</dd></div>
            <div><dt>Held by</dt><dd>{item.holder}{item.reference ? ` · ${item.reference}` : ""}</dd></div>
            <div><dt>Licence</dt><dd>{item.licence}</dd></div>
            <div><dt>Credit</dt><dd>{item.credit}</dd></div>
            <div>
              <dt>Source</dt>
              <dd>
                <a href={item.source} target="_blank" rel="noopener noreferrer">Wikimedia Commons record</a>
                {item.record && <> · <a href={item.record} target="_blank" rel="noopener noreferrer">{item.holder.split(",")[0]} record</a></>}
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-xs text-dust">Keys: ← → plates · + − zoom · 0 reset · Esc close</p>
        </aside>
      </div>
    </div>
  );
}
