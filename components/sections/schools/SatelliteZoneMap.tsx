"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "./satellite-map.css";

import { AttributionControl, LngLat, Map as MlMap, Marker, NavigationControl, setWorkerUrl, type LngLatBoundsLike } from "maplibre-gl";
import Link from "next/link";
import { useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  allPlaces,
  hubCoordinates,
  satelliteCopy as copy,
  tourOrder,
  views,
  type HubId,
  type SatellitePlace,
} from "@/lib/content/satellite-map";

/**
 * The satellite map in the Zones section of /schools (R-satellite, 3 Nov 2026). It replaces the three.js diorama of Hyderabad with real
 * imagery: MapTiler Hybrid v4 drawn by MapLibre GL JS. Three proposed Hyderabad hub areas close in; zooming out (or the "All India" button)
 * shows the six planned circuits and two heritage places. Every marker says what it is: none is an operating campus.
 *
 * The key is a public client key (NEXT_PUBLIC_MAPTILER_KEY); restrict it to the site's origins in the MapTiler dashboard.
 * Nothing here draws a zone boundary, because the project has none surveyed: the rotating dashed ring is a marker halo.
 */

// MapLibre finds its worker next to its own chunk, which a bundler moves; the file is self-contained, so the bundler serves it as an asset.
setWorkerUrl(new URL("../../../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

const STYLE = "https://api.maptiler.com/maps/hybrid-v4/style.json";
const KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
/** Below this zoom the national markers show; above it, the Hyderabad hubs. */
const VIEW_SWITCH_ZOOM = 7.2;

type Mode = "hyderabad" | "india";
type Status = "loading" | "ready" | "nokey" | "nogl" | "fail";

export interface SatelliteZoneMapProps {
  /** A request from outside (the hub directory) to fly to a hub; `nonce` lets the same hub be asked for twice. */
  focus?: { hubId: HubId; nonce: number } | null;
  /** The hub the directory is pointing at (hover or selection); its pin glows. */
  highlightHubId?: HubId | null;
  onSelectHub?: (id: HubId) => void;
  onReady?: () => void;
  className?: string;
  /** "panel" is the framed map in the Zones section; "hero" fills its parent edge to edge (the first screen of /schools). */
  variant?: "panel" | "hero";
  /** Which view the map opens on. */
  initialMode?: Mode;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function SatelliteZoneMap({ focus = null, highlightHubId = null, onSelectHub, onReady, className, variant = "panel", initialMode = "hyderabad" }: SatelliteZoneMapProps) {
  const hero = variant === "hero";
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const pinsRef = useRef<Map<string, { marker: Marker; el: HTMLButtonElement }>>(new Map());
  const tourRef = useRef(0);
  const reducedRef = useRef(false);
  const live = useInView(rootRef, { amount: 0 });

  const [status, setStatus] = useState<Status>(KEY ? "loading" : "nokey");
  const [mode, setMode] = useState<Mode>(initialMode);
  // Full screen: the browser's own full screen where there is one, a fixed overlay (Esc closes it) where there is not (iPhone Safari).
  const [full, setFull] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [touring, setTouring] = useState(false);

  // Latest props for the handlers that the map and the markers keep for their lifetime.
  const onSelectRef = useRef(onSelectHub);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onSelectRef.current = onSelectHub;
    onReadyRef.current = onReady;
  });

  const padding = useCallback(() => {
    const narrow = (frameRef.current?.clientWidth ?? 800) < 640;
    // The hero map sits under the site's bar (80 px), so its fit starts below it.
    if (hero) return narrow ? { top: 120, bottom: 72, left: 24, right: 24 } : { top: 130, bottom: 72, left: 56, right: 56 };
    return narrow ? { top: 64, bottom: 64, left: 24, right: 24 } : { top: 72, bottom: 56, left: 56, right: 56 };
  }, [hero]);
  const cardPadding = useCallback(() => {
    const narrow = (frameRef.current?.clientWidth ?? 800) < 640;
    if (hero) return narrow ? { top: 120, bottom: 250, left: 20, right: 20 } : { top: 120, bottom: 50, left: 330, right: 40 };
    return narrow ? { top: 56, bottom: 250, left: 20, right: 20 } : { top: 60, bottom: 50, left: 330, right: 40 };
  }, [hero]);

  /** One camera move: a flight, or a jump when motion is reduced. */
  const moveTo = useCallback((opts: { center: [number, number]; zoom: number; pitch?: number; bearing?: number; padding?: ReturnType<typeof padding>; duration?: number }) => {
    const map = mapRef.current;
    if (!map) return;
    const o = { pitch: 0, bearing: 0, ...opts };
    if (reducedRef.current) map.jumpTo(o);
    else map.flyTo({ ...o, duration: opts.duration ?? 2800, curve: 1.6, easing: easeInOut, essential: true });
  }, []);

  const goView = useCallback(
    (v: Mode) => {
      const map = mapRef.current;
      if (!map) return;
      const cam = map.cameraForBounds(views[v].bounds as LngLatBoundsLike, { padding: padding() });
      if (!cam?.center) return;
      const c = LngLat.convert(cam.center);
      setPlaceId(null);
      moveTo({
        center: [c.lng, c.lat],
        zoom: cam.zoom ?? 5,
        pitch: v === "hyderabad" ? 30 : 0,
        bearing: v === "hyderabad" ? -8 : 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        duration: 3000,
      });
    },
    [moveTo, padding],
  );

  /** Select a place: open its card and fly there. `fromOutside` skips telling the directory (it asked for it). */
  const selectPlace = useCallback(
    (id: string, opts: { fromOutside?: boolean; fromTour?: boolean } = {}) => {
      const place = allPlaces.find((p) => p.id === id);
      if (!place) return;
      if (!opts.fromTour) {
        tourRef.current += 1;
        setTouring(false);
      }
      setPlaceId(id);
      if (place.hubId && !opts.fromOutside) onSelectRef.current?.(place.hubId);
      const slug = place.hubId ? (Object.keys(hubCoordinates) as (keyof typeof hubCoordinates)[]).find((s) => hubCoordinates[s].id === place.hubId) : undefined;
      if (place.kind === "hub" && slug) {
        moveTo({ center: place.lonLat, zoom: 14.4, pitch: 52, bearing: hubCoordinates[slug].bearing, padding: cardPadding(), duration: 2800 });
      } else {
        moveTo({ center: place.lonLat, zoom: place.kind === "circuit" ? 6.4 : 7.4, pitch: 0, bearing: 0, padding: cardPadding(), duration: 2400 });
      }
    },
    [moveTo, cardPadding],
  );
  const selectRef = useRef(selectPlace);
  useEffect(() => {
    selectRef.current = selectPlace;
  });

  const stopTour = useCallback(() => {
    tourRef.current += 1;
    setTouring(false);
  }, []);

  const runTour = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const token = ++tourRef.current;
    setTouring(true);
    for (const hubId of tourOrder) {
      if (token !== tourRef.current) return;
      selectRef.current(`hub-${hubId}`, { fromTour: true });
      await wait(reducedRef.current ? 2200 : 5200);
    }
    if (token !== tourRef.current) return;
    goView("hyderabad");
    setTouring(false);
  }, [goView]);

  const toggleFull = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    if (full) {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      setFull(false);
      setOverlay(false);
      return;
    }
    setFull(true);
    if (el.requestFullscreen) el.requestFullscreen().catch(() => setOverlay(true));
    else setOverlay(true);
  }, [full]);

  // The browser's own Esc (or a swipe down) leaves full screen without going through the button; the overlay has its own Esc.
  useEffect(() => {
    if (!full) return;
    const onChange = () => {
      if (!document.fullscreenElement && !overlay) setFull(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlay) {
        setFull(false);
        setOverlay(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("keydown", onKey);
    };
  }, [full, overlay]);

  // The frame changes size and the map has to follow; whole-page scrolling is the map's job while it fills the screen.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (full) map.cooperativeGestures.disable();
    else map.cooperativeGestures.enable();
    const frames = [requestAnimationFrame(() => map.resize())];
    const late = window.setTimeout(() => map.resize(), 300);
    return () => {
      frames.forEach(cancelAnimationFrame);
      window.clearTimeout(late);
    };
  }, [full]);

  // Build the map once.
  useEffect(() => {
    const container = frameRef.current;
    if (!container) return;
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!KEY) return;
    const mapEl = container.querySelector<HTMLDivElement>("[data-map-canvas]");
    if (!mapEl) return;
    const pins = pinsRef.current;
    let map: MlMap;
    try {
      map = new MlMap({
        container: mapEl,
        style: `${STYLE}?key=${KEY}`,
        bounds: views[initialMode].bounds as LngLatBoundsLike,
        fitBoundsOptions: { padding: padding(), pitch: initialMode === "hyderabad" ? 30 : 0, bearing: initialMode === "hyderabad" ? -8 : 0 },
        minZoom: 2.6,
        maxZoom: 16,
        maxBounds: [[52, -8], [112, 46]],
        renderWorldCopies: false,
        attributionControl: false,
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
        fadeDuration: 120,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      window.setTimeout(() => setStatus("nogl"), 0);
      return;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new AttributionControl({ compact: false }), "bottom-right");

    let loaded = false;
    const setView = (v: Mode) => {
      if (container.dataset.view !== v) container.dataset.view = v;
    };
    setView(initialMode);

    const onZoom = () => setView(map.getZoom() < VIEW_SWITCH_ZOOM ? "india" : "hyderabad");
    const onZoomEnd = () => setMode(map.getZoom() < VIEW_SWITCH_ZOOM ? "india" : "hyderabad");
    const onUser = (e: { originalEvent?: unknown }) => {
      if (e.originalEvent) {
        tourRef.current += 1;
        setTouring(false);
      }
    };
    map.on("zoom", onZoom);
    map.on("zoomend", onZoomEnd);
    map.on("dragstart", onUser);
    map.on("zoomstart", onUser);

    map.on("load", () => {
      loaded = true;
      for (const place of allPlaces) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = `bsah-pin bsah-pin--${place.kind}`;
        el.setAttribute("aria-label", `${place.label}. ${place.status}.`);
        el.innerHTML =
          '<span class="bsah-pin__ring" aria-hidden="true"></span><span class="bsah-pin__halo" aria-hidden="true"></span><span class="bsah-pin__dot" aria-hidden="true"></span><span class="bsah-pin__label"></span>';
        (el.querySelector(".bsah-pin__label") as HTMLElement).textContent = place.label;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          selectRef.current(place.id);
        });
        const marker = new Marker({ element: el, anchor: "center" }).setLngLat(place.lonLat).addTo(map);
        pins.set(place.id, { marker, el });
      }
      setStatus("ready");
      onReadyRef.current?.();
    });
    map.on("error", () => {
      if (!loaded) setStatus((s) => (s === "loading" ? "fail" : s));
    });

    return () => {
      tourRef.current += 1;
      pins.forEach(({ marker }) => marker.remove());
      pins.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [padding, initialMode]);

  // A request from the hub directory.
  useEffect(() => {
    if (!focus || status !== "ready") return;
    selectRef.current(`hub-${focus.hubId}`, { fromOutside: true });
  }, [focus, status]);

  // Glow the pin the directory points at, and the pin whose card is open.
  useEffect(() => {
    pinsRef.current.forEach(({ el }, id) => {
      const hubId = id.startsWith("hub-") ? id.slice(4) : null;
      el.classList.toggle("is-hot", id === placeId || (hubId !== null && hubId === highlightHubId));
      el.classList.toggle("is-open", id === placeId);
    });
  }, [placeId, highlightHubId, status]);

  const place: SatellitePlace | null = placeId ? (allPlaces.find((p) => p.id === placeId) ?? null) : null;
  const failed = status === "nokey" || status === "nogl" || status === "fail";

  return (
    <div ref={rootRef} className={cn("flex flex-col gap-3", hero && "h-full", className)}>
      <div
        ref={frameRef}
        data-view="hyderabad"
        data-live={live ? "on" : "off"}
        data-lenis-prevent={full ? "" : undefined}
        className={cn(
          "bsah-sat relative w-full overflow-hidden bg-[#1b1510]",
          full
            ? cn("h-full min-h-0", overlay && "fixed inset-0 z-[100] h-[100dvh]")
            : hero
              ? "h-full"
              : "aspect-[4/3] min-h-[500px] rounded-2xl border border-line/60 shadow-xl lg:min-h-[620px]",
        )}
        role="region"
        aria-label={copy.region}
      >
        {/* Inline: MapLibre's own stylesheet sets .maplibregl-map to position:relative, which would collapse an absolutely sized canvas. */}
        <div data-map-canvas style={{ position: "absolute", inset: 0 }} />

        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#1b1510]" aria-live="polite">
            <p className="label text-sand">Loading satellite view</p>
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 grid place-items-center bg-[#1b1510] p-8 text-center">
            <p className="t-ui max-w-[30ch] text-sm text-bone/90" style={{ color: "#f3ede2" }}>
              {status === "nokey" ? copy.noKey : status === "nogl" ? copy.noGl : copy.loadFail}
            </p>
          </div>
        )}

        {status === "ready" && (
          <>
            {/* View switch, tour and reset */}
            <div className={cn("absolute left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2", hero ? "top-24 md:top-28" : "top-3")}>
              <div className="bsah-seg" role="group" aria-label="Map view">
                {(["hyderabad", "india"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={mode === v}
                    onClick={() => {
                      stopTour();
                      goView(v);
                    }}
                  >
                    {copy.views[v]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="bsah-chip" onClick={() => (touring ? stopTour() : void runTour())} aria-pressed={touring}>
                  {touring ? copy.stopTour : copy.tour}
                </button>
                <button
                  type="button"
                  className="bsah-chip"
                  onClick={() => {
                    stopTour();
                    goView(mode);
                  }}
                >
                  {copy.reset}
                </button>
                {!hero && (
                  <button type="button" className="bsah-chip" onClick={toggleFull} aria-pressed={full}>
                    {full ? copy.exitFull : copy.fullScreen}
                  </button>
                )}
              </div>
            </div>

            {/* The open place */}
            {place && (
              <div
                key={place.id}
                aria-live="polite"
                className="bsah-card absolute inset-x-3 bottom-12 z-10 sm:inset-x-auto sm:bottom-12 sm:left-3 sm:w-[21.5rem]"
              >
                <button type="button" className="bsah-card__close" onClick={() => setPlaceId(null)} aria-label={copy.close}>
                  ×
                </button>
                <p className="bsah-card__eyebrow">{place.eyebrow}</p>
                <h3 className="bsah-card__title">{place.title}</h3>
                <p className="bsah-card__loc">{place.location}</p>
                <p className={cn("bsah-card__status", place.kind === "hub" && "is-proposed")}>{place.status}</p>
                <p className="bsah-card__body">{place.body}</p>
                {place.facts.length > 0 && (
                  <dl className="bsah-card__facts">
                    {place.facts.slice(0, 4).map((f) => (
                      <div key={f.k}>
                        <dt>{f.k}</dt>
                        <dd>{f.v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="bsah-card__actions">
                  {place.link && (
                    <Link href={place.link.href} className="bsah-card__link">
                      {place.link.label} →
                    </Link>
                  )}
                  {place.id === "circuit-hyderabad" && (
                    <button type="button" className="bsah-card__link" onClick={() => goView("hyderabad")}>
                      Zoom to the three Hyderabad areas →
                    </button>
                  )}
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {!hero && !full && (
        <p className="t-ui text-xs text-dust">
          {copy.hint} {copy.sources}
        </p>
      )}
    </div>
  );
}
