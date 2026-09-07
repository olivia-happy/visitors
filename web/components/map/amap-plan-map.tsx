"use client";

import { useEffect, useRef, useState } from "react";

import {
  buildMapSummary,
  groupMapPointsByDay,
  sortMapPointsByRoute,
} from "@/lib/map-helpers";
import type { MapPoint, OutputLanguage } from "@/lib/schemas";

type AmapPlanMapProps = {
  city: string;
  language: OutputLanguage;
  mapPoints: MapPoint[];
};

type MapStatus = "empty" | "error" | "loading" | "missing-key" | "ready";

type FallbackNode = {
  dayIndex: number | null;
  label: string | null;
  sequenceNo: number | null;
  x: number;
  y: number;
};

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

const copyByLanguage = {
  "zh-CN": {
    heroKicker: "高德路线",
    heroTitle: "{city} 路线总览",
    summary: "路线摘要",
    stops: "节点数",
    days: "天数",
    firstStop: "第一站",
    lastStop: "最后一站",
    notGenerated: "待生成",
    dayRoute: "分日路线",
    dayLabel: "第 {day} 天",
    emptyDayRoute: "生成行程后，这里会按天展示路线顺序。",
    status: {
      empty: {
        badge: "暂无路线",
        title: "地图正在等待路线点位。",
        description: "等到行程带上坐标后，这里会渲染城市路线和停留顺序。",
      },
      "missing-key": {
        badge: "静态预览",
        title: "还没有配置高德地图 Key。",
        description:
          "补上地图密钥后，这里就会切成实时地图，而不是当前的静态预览面板。",
      },
      error: {
        badge: "加载失败",
        title: "高德地图加载失败。",
        description:
          "请检查 JS Key、安全密钥和浏览器控制台。下面的路线摘要仍然会继续使用已生成的行程数据。",
      },
      loading: {
        badge: "加载中",
        title: "正在加载城市路线地图。",
        description:
          "行程点位已经准备好，前端正在加载高德 JS SDK 并绘制路线。",
      },
      ready: {
        badge: "实时地图",
        title: "高德路线已准备好。",
        description: "当前路线正在使用已生成的节点坐标。",
      },
    },
  },
  en: {
    heroKicker: "AMap route",
    heroTitle: "{city} route overview",
    summary: "Route summary",
    stops: "Stops",
    days: "Days",
    firstStop: "First stop",
    lastStop: "Last stop",
    notGenerated: "Not generated",
    dayRoute: "Day route",
    dayLabel: "Day {day}",
    emptyDayRoute: "Generate an itinerary to render the route day by day.",
    status: {
      empty: {
        badge: "No route",
        title: "The map is waiting for route points.",
        description:
          "Once the itinerary includes coordinates, this panel will render the city route and stop order.",
      },
      "missing-key": {
        badge: "Fallback",
        title: "The AMap key is missing.",
        description:
          "Add NEXT_PUBLIC_AMAP_JS_KEY to web/.env.local to render the live map instead of the fallback panel.",
      },
      error: {
        badge: "Retry needed",
        title: "AMap failed to load.",
        description:
          "Check the JS key, security code, and browser console. The route summary below still uses the generated plan data.",
      },
      loading: {
        badge: "Loading",
        title: "Loading the city route map.",
        description:
          "The itinerary points are ready. The client is now loading the AMap JS SDK and drawing the route.",
      },
      ready: {
        badge: "Live map",
        title: "The AMap route is ready.",
        description: "The route is using the generated stop coordinates.",
      },
    },
  },
} as const;

export function AmapPlanMap({ city, language, mapPoints }: AmapPlanMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ destroy: () => void } | null>(null);
  const [loadState, setLoadState] = useState<{
    kind: "error" | "idle" | "ready";
    signature: string | null;
  }>({
    kind: "idle",
    signature: null,
  });

  const copy = copyByLanguage[language];
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
        const nextSummary = buildMapSummary(nextOrderedPoints);

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

  const statusCopy = copy.status[status];
  const previewPoints = orderedPoints.slice(0, 4);
  const fallbackNodes = buildFallbackNodes(previewPoints);

  return (
    <div className="grid gap-4">
      <div className="amap-route-card">
        <div className="amap-route-head">
          <div>
            <p className="planner-kicker">{copy.heroKicker}</p>
            <h3 className="mt-1 text-[0.88rem] font-semibold text-foreground">
              {copy.heroTitle.replace("{city}", city)}
            </h3>
          </div>
          <span className="result-chip-soft text-[0.62rem] font-semibold">
            {statusCopy.badge}
          </span>
        </div>
        <div className="amap-route-viewport" data-status={status}>
          <div ref={containerRef} className="amap-route-canvas" />
          {status !== "ready" ? (
            <div className="amap-route-fallback" data-status={status}>
              <svg
                aria-hidden="true"
                className="amap-route-schematic"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <defs>
                  <linearGradient
                    id="amap-route-gradient"
                    x1="0%"
                    x2="100%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(31, 53, 45, 0.32)" />
                    <stop offset="52%" stopColor="rgba(143, 104, 73, 0.52)" />
                    <stop offset="100%" stopColor="rgba(31, 53, 45, 0.2)" />
                  </linearGradient>
                </defs>
                <path
                  className="amap-route-schematic-path"
                  d={buildFallbackPath(fallbackNodes)}
                />
                {fallbackNodes.map((node, index) => (
                  <g key={`fallback-node-${node.x}-${node.y}-${index}`}>
                    <circle
                      className="amap-route-schematic-node-ring"
                      cx={node.x}
                      cy={node.y}
                      r="4.5"
                    />
                    <circle
                      className="amap-route-schematic-node-core"
                      cx={node.x}
                      cy={node.y}
                      r="1.85"
                    />
                  </g>
                ))}
              </svg>

              <div aria-hidden="true" className="amap-route-grid-lines" />

              <div className="amap-route-fallback-shell">
                <section className="amap-route-fallback-note">
                  <div className="amap-route-fallback-head">
                    <span className="amap-route-fallback-badge">
                      {statusCopy.badge}
                    </span>
                    {status === "missing-key" ? (
                      <code className="amap-route-fallback-code">
                        NEXT_PUBLIC_AMAP_JS_KEY
                      </code>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <h4 className="amap-route-fallback-title">
                      {statusCopy.title}
                    </h4>
                    <p className="amap-route-fallback-copy">
                      {statusCopy.description}
                    </p>
                  </div>
                </section>

                <aside className="amap-route-fallback-dossier">
                  <div className="amap-route-fallback-metrics">
                    <FallbackMetric
                      label={copy.stops}
                      value={String(summary.stopCount || 0).padStart(2, "0")}
                    />
                    <FallbackMetric
                      label={copy.days}
                      value={String(summary.dayCount || 0).padStart(2, "0")}
                    />
                  </div>

                  <div className="amap-route-fallback-tape">
                    <p className="amap-route-fallback-tape-kicker">
                      {copy.dayRoute}
                    </p>
                    {previewPoints.length ? (
                      <div className="amap-route-fallback-stop-list">
                        {previewPoints.map((point) => (
                          <div
                            key={`fallback-stop-${point.sequence_no}-${point.name}`}
                            className="amap-route-fallback-stop"
                          >
                            <span className="amap-route-fallback-stop-index">
                              {String(point.sequence_no).padStart(2, "0")}
                            </span>
                            <div className="grid gap-1">
                              <p className="amap-route-fallback-stop-title">
                                {point.name}
                              </p>
                              <p className="amap-route-fallback-stop-meta">
                                {copy.dayLabel.replace(
                                  "{day}",
                                  String(point.day_index),
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="amap-route-fallback-empty">
                        {copy.emptyDayRoute}
                      </p>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="result-surface p-4">
          <p className="result-panel-kicker">{copy.summary}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MetricCard label={copy.stops} value={String(summary.stopCount)} />
            <MetricCard label={copy.days} value={String(summary.dayCount)} />
            <MetricCard
              label={copy.firstStop}
              value={summary.firstStopName ?? copy.notGenerated}
            />
            <MetricCard
              label={copy.lastStop}
              value={summary.lastStopName ?? copy.notGenerated}
            />
          </div>
        </section>

        <section className="result-surface p-4">
          <p className="result-panel-kicker">{copy.dayRoute}</p>
          <div className="mt-3 grid gap-3">
            {dayGroups.length ? (
              dayGroups.map((group) => (
                <article
                  key={group.dayIndex}
                  className="rounded-[0.98rem] border border-line/60 bg-[#fffdf7] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                >
                  <p className="text-[0.78rem] font-semibold text-accent">
                    {copy.dayLabel.replace("{day}", String(group.dayIndex))}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.points.map((point) => (
                      <span
                        key={`${group.dayIndex}-${point.sequence_no}-${point.name}`}
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-[0.68rem] text-foreground"
                      >
                        #{point.sequence_no} {point.name}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">{copy.emptyDayRoute}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[0.98rem] border border-line/60 bg-[#fffdf7] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.52)]">
      <p className="text-[0.62rem] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-[0.78rem] font-semibold text-foreground">{value}</p>
    </article>
  );
}

function FallbackMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="amap-route-fallback-metric">
      <p className="amap-route-fallback-metric-label">{label}</p>
      <p className="amap-route-fallback-metric-value">{value}</p>
    </article>
  );
}

function buildFallbackNodes(points: MapPoint[]): FallbackNode[] {
  const basePositions = [
    { x: 14, y: 78 },
    { x: 31, y: 59 },
    { x: 48, y: 40 },
    { x: 72, y: 56 },
    { x: 88, y: 24 },
  ];
  const count = Math.max(points.length, 4);

  return basePositions.slice(0, count).map((position, index) => ({
    x: position.x,
    y: position.y,
    label: points[index]?.name ?? null,
    sequenceNo: points[index]?.sequence_no ?? null,
    dayIndex: points[index]?.day_index ?? null,
  }));
}

function buildFallbackPath(nodes: FallbackNode[]) {
  if (!nodes.length) {
    return "";
  }

  return nodes
    .map((node, index) => {
      if (index === 0) {
        return `M ${node.x} ${node.y}`;
      }

      const previous = nodes[index - 1];
      const controlX = (previous.x + node.x) / 2;
      return `Q ${controlX} ${previous.y}, ${node.x} ${node.y}`;
    })
    .join(" ");
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
