"use client";

import {
  formatSeverity,
  formatTransportMode,
} from "@/lib/result-formatters";
import type { OutputLanguage, PlanDraft } from "@/lib/schemas";

type ResultCoverInsightsProps = {
  language: OutputLanguage;
  plan: PlanDraft | null;
};

const copyByLanguage = {
  "zh-CN": {
    labels: {
      firstMove: "首个动作",
      reservation: "预约重点",
      access: "落地动线",
    },
    pending: "待生成",
    firstMoveMeta: "{time} · {mode} · {minutes} 分钟",
    reservationMeta: "{severity}{channel}",
    reservationChannel: " · {value}",
    parkingFor: "对应 {value}",
    parkingMeta: "步行约 {minutes} 分钟{price}",
    parkingPrice: " · {value}",
    stayMeta: "住在 {value}",
    accessPending: "等待停车或住宿片区判断",
  },
  en: {
    labels: {
      firstMove: "First move",
      reservation: "Reservation watch",
      access: "Ground access",
    },
    pending: "Pending",
    firstMoveMeta: "{time} · {mode} · {minutes} min",
    reservationMeta: "{severity}{channel}",
    reservationChannel: " · {value}",
    parkingFor: "For {value}",
    parkingMeta: "About {minutes} min walk{price}",
    parkingPrice: " · {value}",
    stayMeta: "Stay around {value}",
    accessPending: "Waiting for parking or stay guidance",
  },
} as const;

export function ResultCoverInsights({
  language,
  plan,
}: ResultCoverInsightsProps) {
  const copy = copyByLanguage[language];
  const firstStop = plan?.timeline?.[0] ?? null;
  const topRisk = plan?.reservation_risks?.[0] ?? null;
  const topParking = plan?.parking_guides?.[0] ?? null;
  const topHotel = plan?.hotel_area_recommendations?.[0] ?? null;

  const cards = [
    {
      label: copy.labels.firstMove,
      title: firstStop?.title ?? copy.pending,
      body: firstStop
        ? copy.firstMoveMeta
            .replace(
              "{time}",
              `${firstStop.start_time}-${firstStop.end_time}`,
            )
            .replace(
              "{mode}",
              formatTransportMode(firstStop.transport_mode, language),
            )
            .replace(
              "{minutes}",
              String(firstStop.transport_duration_minutes),
            )
        : copy.pending,
      tone: "soft" as const,
      wide: false,
    },
    {
      label: copy.labels.reservation,
      title: topRisk?.poi_name ?? copy.pending,
      body: topRisk
        ? copy.reservationMeta
            .replace("{severity}", formatSeverity(topRisk.severity, language))
            .replace(
              "{channel}",
              topRisk.reservation_channel
                ? copy.reservationChannel.replace(
                    "{value}",
                    topRisk.reservation_channel,
                  )
                : "",
            )
        : copy.pending,
      tone: "warm" as const,
      wide: false,
    },
    buildAccessCard({
      copy,
      language,
      plan,
      topHotel,
      topParking,
    }),
  ];

  return (
    <div className="result-insight-grid">
      {cards.map((card) => (
        <article
          key={card.label}
          className="result-insight-card"
          data-span={card.wide ? "wide" : "default"}
          data-tone={card.tone}
        >
          <p className="result-insight-eyebrow">{card.label}</p>
          <h3 className="result-insight-title">{card.title}</h3>
          <p className="result-insight-copy">{card.body}</p>
        </article>
      ))}
    </div>
  );
}

function buildAccessCard({
  copy,
  language,
  plan,
  topHotel,
  topParking,
}: {
  copy: (typeof copyByLanguage)["zh-CN"] | (typeof copyByLanguage)["en"];
  language: OutputLanguage;
  plan: PlanDraft | null;
  topHotel: PlanDraft["hotel_area_recommendations"][number] | null;
  topParking: PlanDraft["parking_guides"][number] | null;
}) {
  if (topParking) {
    return {
      label: copy.labels.access,
      title: topParking.recommended_lot_name,
      body: `${copy.parkingFor.replace("{value}", topParking.poi_name)} · ${copy.parkingMeta
        .replace("{minutes}", String(topParking.walking_minutes))
        .replace(
          "{price}",
          topParking.price_note
            ? copy.parkingPrice.replace("{value}", topParking.price_note)
            : "",
        )}`,
      tone: "line" as const,
      wide: true,
    };
  }

  if (topHotel) {
    return {
      label: copy.labels.access,
      title: topHotel.area_name,
      body: `${copy.stayMeta.replace("{value}", topHotel.parking_convenience)} · ${topHotel.access_note}`,
      tone: "line" as const,
      wide: true,
    };
  }

  return {
    label: copy.labels.access,
    title:
      plan?.execution_summary?.transport_strategy ??
      formatTransportMode(plan?.transport_preferences?.[0], language),
    body:
      plan?.special_requirements ||
      plan?.stay_preference ||
      copy.accessPending,
    tone: "line" as const,
    wide: true,
  };
}
