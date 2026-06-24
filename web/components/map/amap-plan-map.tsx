"use client";

import { useEffect, useRef, useState } from "react";

import { buildMapSummary, groupMapPointsByDay, sortMapPointsByRoute } from "@/lib/map-helpers";
import type { MapPoint } from "@/lib/schemas";

type AmapPlanMapProps = {
  city: string;
  mapPoints: MapPoint[];
};

type MapStatus = "empty" | "error" | "loading" | "missing-key" | "ready";

type AMapNamespace = {
  Map: new (
    container: HTMLDivElement,
    options: {
      center: [number, number];
      mapStyle?: string;
      resizeEnable?: boolean;
      viewMode?: string;
      zoom?: number;
    },
  ) => {
    add: (overlays: unknown[]) => void;
    destroy: () => void;
    setFitView: () => void;
  };
  Marker: new (options: {
    position: [number, number];
    title: string;
  }) => unknown;
  Polyline: new (options: {
    path: Array<[number, number]>;
    strokeColor: string;
    strokeOpacity: number;
    strokeStyle: string;
    strokeWeight: number;
  }) => unknown;
};

declare global {
  interface Window {
    AMap?: AMapNamespace;
    _AMapSecurityConfig?: {
      securityJsCode?: string;
    };
  }
}

const AMAP_SCRIPT_ID = "visitors-amap-js-sdk";
let amapPromise: Promise<AMapNamespace> | null = null;

export function AmapPlanMap({ city, mapPoints }: AmapPlanMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ destroy: () => void } | null>(null);
  const [loadState, setLoadState] = useState<{
    kind: "error" | "idle" | "ready";
    signature: string | null;
  }>({
    kind: "idle",
    signature: null,
  });

  const amapKey = process.env.NEXT_PUBLIC_AMAP_JS_KEY ?? "";
  const securityJsCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE ?? "";
  const orderedPoints = sortMapPointsByRoute(mapPoints);
  const summary = buildMapSummary(orderedPoints);
  const dayGroups = groupMapPointsByDay(orderedPoints);
  const routeSignature = orderedPoints
    .map(
      (point) =>
        `${point.sequence_no}:${point.day_index}:${point.lng}:${point.lat}:${point.name}`,
    )
    .join("|");
  const status: MapStatus = !orderedPoints.length
    ? "empty"
    : !amapKey
      ? "missing-key"
      : loadState.kind === "ready" && loadState.signature === routeSignature
        ? "ready"
        : loadState.kind === "error" && loadState.signature === routeSignature
          ? "error"
          : "loading";

  useEffect(() => {
    if (!mapPoints.length || !amapKey) {
      return;
    }

    if (!containerRef.current) {
      return;
    }

    let cancelled = false;

    void loadAmap(amapKey, securityJsCode)
      .then((AMap) => {
        if (cancelled || !containerRef.current) {
          return;
        }

        const nextOrderedPoints = sortMapPointsByRoute(mapPoints);
        const nextSummary = buildMapSummary(mapPoints);

        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }

        containerRef.current.innerHTML = "";

        const center: [number, number] = nextSummary.center
          ? [nextSummary.center.lng, nextSummary.center.lat]
          : [nextOrderedPoints[0].lng, nextOrderedPoints[0].lat];

        const map = new AMap.Map(containerRef.current, {
          center,
          zoom: nextOrderedPoints.length > 1 ? 11 : 13,
          viewMode: "2D",
          resizeEnable: true,
          mapStyle: "amap://styles/whitesmoke",
        });

        const markers = nextOrderedPoints.map(
          (point, index) =>
            new AMap.Marker({
              position: [point.lng, point.lat],
              title: `${index + 1}. ${point.name}`,
            }),
        );

        const polyline = new AMap.Polyline({
          path: nextOrderedPoints.map(
            (point): [number, number] => [point.lng, point.lat],
          ),
          strokeColor: "#23523d",
          strokeOpacity: 0.95,
          strokeStyle: "solid",
          strokeWeight: 5,
        });

        map.add([polyline, ...markers]);
        map.setFitView();
        mapRef.current = map;
        setLoadState({
          kind: "ready",
          signature: routeSignature,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState({
            kind: "error",
            signature: routeSignature,
          });
        }
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [amapKey, mapPoints, routeSignature, securityJsCode]);

  const statusCopy = getStatusCopy(status);

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-[1.5rem] border border-line/60 bg-[#eef3e8]">
        <div className="flex items-center justify-between border-b border-line/50 bg-white/70 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              AMap Route
            </p>
            <h3 className="mt-1 text-sm font-semibold text-foreground">
              {city} route overview
            </h3>
          </div>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            {statusCopy.badge}
          </span>
        </div>
        <div className="relative min-h-80 bg-[linear-gradient(135deg,_#dae7d4,_#f5eedf)]">
          <div ref={containerRef} className="h-80 w-full" />
          {status !== "ready" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#eef3e8]/85 p-6 text-center">
              <div className="max-w-md">
                <p className="text-sm font-semibold text-foreground">
                  {statusCopy.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {statusCopy.description}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[1.5rem] border border-line/70 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Route Summary
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Stops" value={String(summary.stopCount)} />
            <MetricCard label="Days" value={String(summary.dayCount)} />
            <MetricCard
              label="First stop"
              value={summary.firstStopName ?? "Not generated"}
            />
            <MetricCard
              label="Last stop"
              value={summary.lastStopName ?? "Not generated"}
            />
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-line/70 bg-white/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Day Route
          </p>
          <div className="mt-3 grid gap-3">
            {dayGroups.length ? (
              dayGroups.map((group) => (
                <article
                  key={group.dayIndex}
                  className="rounded-2xl border border-line/60 bg-[#fffdf7] p-3"
                >
                  <p className="text-sm font-semibold text-accent">
                    Day {group.dayIndex}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.points.map((point) => (
                      <span
                        key={`${group.dayIndex}-${point.sequence_no}-${point.name}`}
                        className="rounded-full border border-line bg-white px-3 py-2 text-xs text-foreground"
                      >
                        #{point.sequence_no} {point.name}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                Generate an itinerary to render the route by day.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-line/60 bg-[#fffdf7] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </article>
  );
}

function getStatusCopy(status: MapStatus): {
  badge: string;
  description: string;
  title: string;
} {
  switch (status) {
    case "empty":
      return {
        badge: "No route",
        title: "Map is waiting for route points.",
        description:
          "Once the itinerary has coordinates, this panel will render the city route and stop sequence.",
      };
    case "missing-key":
      return {
        badge: "Fallback",
        title: "AMap key is missing.",
        description:
          "Add NEXT_PUBLIC_AMAP_JS_KEY to web/.env.local to render the live map instead of the fallback panel.",
      };
    case "error":
      return {
        badge: "Retry needed",
        title: "AMap failed to load.",
        description:
          "Check the JS key, security code, and browser console. The route summary below still uses the generated plan data.",
      };
    case "loading":
      return {
        badge: "Loading",
        title: "Loading the city route map.",
        description:
          "The itinerary points are ready. The client is now loading the AMap JS SDK and drawing the route.",
      };
    case "ready":
      return {
        badge: "Live map",
        title: "AMap route is ready.",
        description: "The route is using the generated stop coordinates.",
      };
  }
}

async function loadAmap(
  key: string,
  securityJsCode: string,
): Promise<AMapNamespace> {
  if (typeof window === "undefined") {
    throw new Error("AMap can only load in the browser.");
  }

  if (window.AMap) {
    return window.AMap;
  }

  if (!amapPromise) {
    amapPromise = new Promise<AMapNamespace>((resolve, reject) => {
      if (securityJsCode) {
        window._AMapSecurityConfig = {
          securityJsCode,
        };
      }

      const existingScript = document.getElementById(
        AMAP_SCRIPT_ID,
      ) as HTMLScriptElement | null;

      const handleLoad = () => {
        if (window.AMap) {
          resolve(window.AMap);
          return;
        }

        amapPromise = null;
        reject(new Error("AMap script loaded without a global AMap object."));
      };

      const handleError = () => {
        amapPromise = null;
        reject(new Error("Failed to load AMap script."));
      };

      if (existingScript) {
        existingScript.addEventListener("load", handleLoad, { once: true });
        existingScript.addEventListener("error", handleError, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = AMAP_SCRIPT_ID;
      script.async = true;
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(
        key,
      )}`;
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.appendChild(script);
    });
  }

  return amapPromise;
}
