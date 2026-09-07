/**
 * @typedef {import("./schemas").OutputLanguage} OutputLanguage
 * @typedef {import("./schemas").PlanDraft} PlanDraft
 * @typedef {import("./schemas").ReservationHint} ReservationHint
 * @typedef {import("./schemas").TimelineItem} TimelineItem
 * @typedef {import("./schemas").ChecklistItem} ChecklistItem
 * @typedef {import("./schemas").ExecutionSummary} ExecutionSummary
 * @typedef {import("./schemas").ReservationRisk} ReservationRisk
 * @typedef {import("./schemas").ParkingGuide} ParkingGuide
 * @typedef {import("./schemas").HotelAreaRecommendation} HotelAreaRecommendation
 * @typedef {import("./schemas").WeatherSummary} WeatherSummary
 */

const cityAliases = {
  suzhou: {
    "zh-CN": "苏州",
    en: "Suzhou",
  },
  苏州: {
    "zh-CN": "苏州",
    en: "Suzhou",
  },
  "xi'an": {
    "zh-CN": "西安",
    en: "Xi'an",
  },
  xian: {
    "zh-CN": "西安",
    en: "Xi'an",
  },
  西安: {
    "zh-CN": "西安",
    en: "Xi'an",
  },
  hangzhou: {
    "zh-CN": "杭州",
    en: "Hangzhou",
  },
  杭州: {
    "zh-CN": "杭州",
    en: "Hangzhou",
  },
  city: {
    "zh-CN": "这座城市",
    en: "This city",
  },
};

const placeLabelTranslations = {
  苏州博物馆: "Suzhou Museum",
  平江路: "Pingjiang Road",
  双塔市集: "Twin Pagodas Market",
  山塘街: "Shantang Street",
  苏州博物馆北停车场: "Suzhou Museum North Parking Lot",
  山塘街游客中心停车场: "Shantang Street Visitor Center Parking Lot",
  双塔停车场: "Twin Pagodas Parking Lot",
  相门城墙停车场: "Xiangmen Wall Parking Lot",
  平江路东侧: "East side of Pingjiang Road",
  金鸡湖东岸: "East bank of Jinji Lake",
  拙政园: "Humble Administrator's Garden",
  园林博物馆停车场: "Garden Museum Parking Lot",
  陕西历史博物馆: "Shaanxi History Museum",
  大雁塔: "Giant Wild Goose Pagoda",
  永兴坊: "Yongxing Fang",
  西安城墙: "Xi'an City Wall",
  西湖: "West Lake",
  孤山: "Gushan",
  法喜寺: "Faxi Temple",
  龙翔桥: "Longxiangqiao",
};

const exactTextTranslations = {
  "适合作为主行程节点，注意入场与停留时长。":
    "Best used as a primary stop with controlled entry timing.",
  "适合慢节奏步行和拍照记录。":
    "Good for slower citywalking and photo-friendly pacing.",
  "适合作为补能和本地风味体验节点。":
    "Useful as a recharge stop with local food options.",
  "适合安排在傍晚或夜间收尾。":
    "Works well as an evening or night close-out stop.",
  "适合作为城市代表性地标安排。":
    "A strong landmark stop for city identity.",
  "适合出片和轻量记录。":
    "Useful for photo-oriented and lightweight recording stops.",
  "适合作为住宿或换乘便利参考区域。":
    "Useful as a stay area or transport anchor.",
  "用于交通出行和酒店入住核验。":
    "Required for transport and hotel check-in.",
  "方便导航、拍照和记录行程。":
    "Useful for map navigation and trip recording.",
  "景点存在学生票时可直接使用。":
    "Needed for student-price tickets when available.",
  "适合拍照节点较多的行程。": "Useful for photo-focused stops.",
  "有降雨风险，换乘和步行段都更方便应对。":
    "Rain is expected, so keep it handy for transfers and citywalk segments.",
  "中午时段紫外线和体感热度会更明显。":
    "Midday UV and heat are likely to be stronger.",
  "晚间偏凉，或是昼夜温差会比较明显。":
    "There may be a cooler evening or a noticeable day-night temperature gap.",
  "建议带一件薄外套，应对早晚偏凉时段。":
    "Pack a light jacket for the cooler hours.",
  "白天户外节点更适合短袖，并补充防晒。":
    "Short sleeves and sun protection work better for midday outdoor stops.",
  "转场时随身带一把折叠伞会更省事。":
    "A compact umbrella will reduce friction when moving between stops.",
  "天气整体较稳定，穿着以耐走和方便活动为主。":
    "Weather looks relatively stable, so keep the outfit practical for long walks.",
  "需要提前预约，公众号可完成实名预约。":
    "Advance reservation required; real-name booking can be completed through the official WeChat account.",
  "苏州博物馆需要提前预约，公众号预约。":
    "Advance booking is required for Suzhou Museum through the official WeChat account.",
  "虽然免费但是要提前预约，公众号预约。":
    "Free admission, but advance booking is required through the official WeChat account.",
  "停车场选择多，适合晚回酒店后步行补逛":
    "More parking choices nearby, useful if you want a short post-dinner walk after returning to the hotel.",
  "去博物馆、平江路和双塔市集都比较顺路":
    "Convenient for the museum, Pingjiang Road, and Twin Pagodas Market in one loop.",
  "酒店自带停车位概率更高，进出城压力更小":
    "Hotels are more likely to include on-site parking, which reduces pressure when driving in and out of the city.",
  "高端酒店更常见免费或封顶停车":
    "Higher-end hotels more often include free or capped parking.",
  "适合把古城和湖区拆成两段开车完成":
    "Useful if you want to split the old town and lake district into two separate driving segments.",
  "平江路更适合下午慢逛，夜景留到山塘街。":
    "Pingjiang Road works better for a slower afternoon walk, and Shantang Street is best saved for night views.",
};

const weatherLabelTranslations = {
  晴: "Sunny",
  多云: "Cloudy",
  阴: "Overcast",
  阵雨: "Showers",
  小雨: "Light rain",
  中雨: "Moderate rain",
  大雨: "Heavy rain",
  暴雨: "Storm rain",
  雷阵雨: "Thunder showers",
  小雪: "Light snow",
  中雪: "Snow",
  大雪: "Heavy snow",
};

const executionHeadlineSegmentTranslations = {
  "这趟更适合上午先完成预约景点":
    "Handle reservation-based stops earlier in the day",
  "这条路线更适合先按主线景点顺序推进":
    "Follow the main route in a low-friction order",
  "下午再转入拍照和慢逛":
    "Leave the afternoon for photo-friendly stops and slower walks",
  "后半程把节奏留给街巷慢逛":
    "Keep the later half focused on relaxed street wandering",
  "后半程更适合留给户外透气和开阔景别":
    "Save the later half for open-air stops and longer views",
  "后半程适合转入园林和人文点位":
    "Reserve the later half for gardens and cultural pacing",
  "后半程保留给机动调整和轻量收尾":
    "Leave room for a practical second-half follow-through",
  "遇到降雨时优先把室内点走完":
    "Keep indoor stops ahead of exposed walking segments",
};

const travelPreferenceTranslations = {
  出片打卡: "Photo-focused stops",
  慢逛街巷: "Relaxed citywalk",
  户外透气: "Open-air route",
  园林人文: "Gardens and culture",
  "周末 2 天": "Weekend 2-day trip",
};

const transportStrategyTranslations = {
  "地铁 + 短距离步行": "Metro + short walks",
  "自驾 + 短距离步行": "Self-drive + short walks",
  "公交 + 步行换乘": "Bus + walking transfers",
  以步行为主: "Mostly walking",
  灵活机动出行: "Flexible city transit",
};

const parkingDifficultyTranslations = {
  一般: "Moderate",
  偏紧张: "Tight",
  周末偏紧张: "Tight on weekends",
  节假日偏紧张: "Tight on holidays",
};

const reservationChannelTranslations = {
  公众号: "Official WeChat account",
  官方小程序: "Official mini program",
  官方公众号: "Official WeChat account",
};

const showcasePlanLocalizations = {
  en: {
    summary:
      "A two-day Suzhou plan that clears reservation-heavy stops first and preserves clean photo windows.",
    xiaohongshu_notes:
      "Suzhou Museum is free, but reservations usually need to be secured well in advance through the official WeChat account. Pingjiang Road works better for a slower afternoon walk, and Shantang Street is best saved for night views.",
    special_requirements: "Prefer student discounts where available.",
    timeline: [
      {
        title: "Suzhou Museum",
        notes:
          "Clear the reservation-heavy museum stop in the morning, then leave the rest of the day open for photos and a slower pace.",
        reservation_hint: {
          poi_name: "Suzhou Museum",
          reminder_text:
            "Advance reservation required; real-name booking can be completed through the official WeChat account.",
          reservation_channel: "Official WeChat account",
          price_note: "Free",
          evidence_excerpt:
            "Free admission, but advance booking is required through the official WeChat account.",
        },
      },
      {
        title: "Pingjiang Road",
        notes:
          "Keep the afternoon for lane wandering, cafe pauses, and photo sessions.",
      },
      {
        title: "Twin Pagodas Market",
        notes: "Works well as a lighter food stop and an easy evening photo node.",
      },
      {
        title: "Shantang Street",
        notes: "Save the night scene and closing stretch for the second evening.",
      },
    ],
    map_points: [
      "Suzhou Museum",
      "Pingjiang Road",
      "Twin Pagodas Market",
      "Shantang Street",
    ],
    checklist_items: [
      {
        item_name: "ID card",
        reason: "Used for transport and hotel identity checks.",
      },
      {
        item_name: "Student ID",
        reason: "Use it directly when student discounts are available.",
      },
      {
        item_name: "Umbrella",
        reason: "Rain is possible, which matters for transfers and walking segments.",
      },
      {
        item_name: "Sunscreen",
        reason:
          "Daytime outdoor stops will feel better in light clothing with sun protection.",
      },
    ],
    weather_summary: {
      city_name: "Suzhou",
      condition_summary: "Light rain -> Partly cloudy",
      overview: "Forecast: light rain turning partly cloudy, 19-31°C.",
      clothing_tip: "Bring a light outer layer and keep an umbrella in your bag.",
    },
    execution_summary: {
      headline:
        "This route works best if you clear the reservation-heavy stop in the morning and shift into photos and slower wandering later.",
      transport_strategy: "Metro + short walking legs",
      best_for: ["Photo-ready check-ins", "2-day weekend escape"],
    },
    reservation_risks: [
      {
        poi_name: "Suzhou Museum",
        reservation_channel: "Official WeChat account",
        price_note: "Free",
        evidence_excerpt:
          "Free admission, but advance booking is required through the official WeChat account.",
      },
    ],
    parking_guides: [
      {
        poi_name: "Suzhou Museum",
        parking_difficulty: "Moderate",
        recommended_lot_name: "Suzhou Museum North Parking Lot",
        price_note: "About RMB 8/hour",
      },
      {
        poi_name: "Shantang Street",
        parking_difficulty: "Tight on holidays",
        recommended_lot_name: "Shantang Street Visitor Center Parking Lot",
        price_note: "About RMB 8/hour",
      },
    ],
    hotel_area_recommendations: [
      {
        area_name: "East side of Pingjiang Road",
        parking_convenience:
          "More parking choices nearby, useful if you want a short post-dinner walk after returning to the hotel.",
        parking_price_note: "Most commercial lots are around RMB 6-8/hour",
        access_note:
          "Convenient for the museum, Pingjiang Road, and Twin Pagodas Market in one loop.",
      },
      {
        area_name: "East bank of Jinji Lake",
        parking_convenience:
          "Hotels are more likely to include on-site parking, which reduces pressure when driving in and out of the city.",
        parking_price_note:
          "Higher-end hotels more often include free or capped parking",
        access_note:
          "Useful if you want to split the old town and lake district into two separate driving segments.",
      },
    ],
    graphNodeLabels: {
      "poi-1": "Suzhou Museum",
      "reservation-1": "Suzhou Museum",
    },
    reservation_hints: [
      {
        poi_name: "Suzhou Museum",
        reminder_text:
          "Advance reservation required; real-name booking can be completed through the official WeChat account.",
        reservation_channel: "Official WeChat account",
        price_note: "Free",
        evidence_excerpt:
          "Free admission, but advance booking is required through the official WeChat account.",
      },
    ],
  },
};

/**
 * @param {string | null | undefined} city
 * @param {OutputLanguage} language
 */
export function formatPlanCityName(city, language) {
  const normalized = String(city ?? "").trim();
  const alias = cityAliases[normalized.toLowerCase()];
  if (alias) {
    return alias[language] ?? alias["zh-CN"];
  }

  return normalized || cityAliases.city[language] || cityAliases.city["zh-CN"];
}

/**
 * @param {PlanDraft | null | undefined} plan
 * @param {OutputLanguage | null | undefined} languageOverride
 * @returns {OutputLanguage}
 */
export function resolvePlanLanguage(plan, languageOverride) {
  if (languageOverride === "en" || languageOverride === "zh-CN") {
    return languageOverride;
  }

  return plan?.output_language === "en" ? "en" : "zh-CN";
}

/**
 * @param {PlanDraft | null | undefined} plan
 * @param {OutputLanguage | null | undefined} languageOverride
 * @returns {PlanDraft | null}
 */
export function localizePlanDraft(plan, languageOverride) {
  if (!plan) {
    return null;
  }

  const language = resolvePlanLanguage(plan, languageOverride);
  if (language !== "en") {
    return plan;
  }

  if (plan.id === "showcase-suzhou") {
    return localizeShowcasePlan(plan);
  }

  return localizeStructuredPlan(plan);
}

/**
 * @param {PlanDraft} plan
 * @returns {PlanDraft}
 */
function localizeStructuredPlan(plan) {
  return {
    ...plan,
    output_language: "en",
    city: translateCityField(plan.city),
    summary: translateText(plan.summary),
    xiaohongshu_notes: translateNotesBlock(plan.xiaohongshu_notes),
    special_requirements: translateText(plan.special_requirements),
    timeline: plan.timeline.map(localizeTimelineItem),
    map_points: plan.map_points.map((point) => ({
      ...point,
      name: translatePlaceLabel(point.name),
    })),
    checklist_items: plan.checklist_items.map(localizeChecklistItem),
    weather_summary: localizeWeatherSummary(plan.weather_summary),
    execution_summary: localizeExecutionSummary(plan.execution_summary),
    reservation_risks: plan.reservation_risks.map(localizeReservationRisk),
    parking_guides: plan.parking_guides.map(localizeParkingGuide),
    hotel_area_recommendations: plan.hotel_area_recommendations.map(
      localizeHotelAreaRecommendation,
    ),
    graph: {
      ...plan.graph,
      nodes: plan.graph.nodes.map((node) => ({
        ...node,
        label: localizeGraphNodeLabel(node.label),
      })),
      edges: plan.graph.edges.map((edge) => ({
        ...edge,
      })),
    },
    reservation_hints: plan.reservation_hints.map((hint) =>
      localizeReservationHint(hint),
    ),
  };
}

/**
 * @param {PlanDraft} plan
 * @returns {PlanDraft}
 */
function localizeShowcasePlan(plan) {
  const copy = showcasePlanLocalizations.en;
  const base = localizeStructuredPlan(plan);

  return {
    ...base,
    summary: copy.summary,
    xiaohongshu_notes: copy.xiaohongshu_notes,
    special_requirements: copy.special_requirements,
    timeline: base.timeline.map((item, index) => {
      const localized = copy.timeline[index];
      return {
        ...item,
        title: localized?.title ?? item.title,
        notes: localized?.notes ?? item.notes,
        reservation_hint: localized?.reservation_hint
          ? localizeReservationHint(item.reservation_hint, localized.reservation_hint)
          : item.reservation_hint,
      };
    }),
    map_points: base.map_points.map((point, index) => ({
      ...point,
      name: copy.map_points[index] ?? point.name,
    })),
    checklist_items: base.checklist_items.map((item, index) => ({
      ...item,
      item_name: copy.checklist_items[index]?.item_name ?? item.item_name,
      reason: copy.checklist_items[index]?.reason ?? item.reason,
    })),
    weather_summary: base.weather_summary
      ? {
          ...base.weather_summary,
          ...copy.weather_summary,
        }
      : null,
    execution_summary: base.execution_summary
      ? {
          ...base.execution_summary,
          ...copy.execution_summary,
        }
      : {
          headline: copy.execution_summary.headline,
          pace: "balanced",
          transport_strategy: copy.execution_summary.transport_strategy,
          best_for: [...copy.execution_summary.best_for],
        },
    reservation_risks: base.reservation_risks.map((risk, index) => ({
      ...risk,
      ...copy.reservation_risks[index],
    })),
    parking_guides: base.parking_guides.map((guide, index) => ({
      ...guide,
      ...copy.parking_guides[index],
    })),
    hotel_area_recommendations: base.hotel_area_recommendations.map(
      (area, index) => ({
        ...area,
        ...copy.hotel_area_recommendations[index],
      }),
    ),
    graph: {
      ...base.graph,
      nodes: base.graph.nodes.map((node) => ({
        ...node,
        label: copy.graphNodeLabels[node.id] ?? node.label,
      })),
    },
    reservation_hints: base.reservation_hints.map((hint, index) =>
      localizeReservationHint(hint, copy.reservation_hints[index]),
    ),
  };
}

/**
 * @param {TimelineItem} item
 * @returns {TimelineItem}
 */
function localizeTimelineItem(item) {
  return {
    ...item,
    title: translatePlaceLabel(item.title),
    notes: translateText(item.notes),
    reservation_hint: localizeReservationHint(item.reservation_hint),
  };
}

/**
 * @param {ChecklistItem} item
 * @returns {ChecklistItem}
 */
function localizeChecklistItem(item) {
  return {
    ...item,
    item_name: translateText(item.item_name),
    reason: translateText(item.reason),
  };
}

/**
 * @param {WeatherSummary | null} summary
 * @returns {WeatherSummary | null}
 */
function localizeWeatherSummary(summary) {
  if (!summary) {
    return null;
  }

  return {
    ...summary,
    city_name: translateCityField(summary.city_name),
    condition_summary: translateWeatherConditionSummary(summary.condition_summary),
    overview: buildEnglishWeatherOverview(summary),
    clothing_tip: translateClothingTip(summary.clothing_tip),
  };
}

/**
 * @param {ExecutionSummary | null} summary
 * @returns {ExecutionSummary | null}
 */
function localizeExecutionSummary(summary) {
  if (!summary) {
    return null;
  }

  return {
    ...summary,
    headline: translateExecutionHeadline(summary.headline),
    transport_strategy: translateTransportStrategy(summary.transport_strategy),
    best_for: summary.best_for.map((item) => translateBestFor(item)),
  };
}

/**
 * @param {ReservationRisk} risk
 * @returns {ReservationRisk}
 */
function localizeReservationRisk(risk) {
  return {
    ...risk,
    poi_name: translatePlaceLabel(risk.poi_name),
    reservation_channel: translateReservationChannel(risk.reservation_channel),
    price_note: translatePriceNote(risk.price_note),
    evidence_excerpt: translateEvidenceExcerpt(risk.evidence_excerpt),
  };
}

/**
 * @param {ParkingGuide} guide
 * @returns {ParkingGuide}
 */
function localizeParkingGuide(guide) {
  return {
    ...guide,
    poi_name: translatePlaceLabel(guide.poi_name),
    parking_difficulty: translateParkingDifficulty(guide.parking_difficulty),
    recommended_lot_name: translatePlaceLabel(guide.recommended_lot_name),
    price_note: translatePriceNote(guide.price_note),
  };
}

/**
 * @param {HotelAreaRecommendation} area
 * @returns {HotelAreaRecommendation}
 */
function localizeHotelAreaRecommendation(area) {
  return {
    ...area,
    area_name: translatePlaceLabel(area.area_name),
    parking_convenience: translateText(area.parking_convenience),
    parking_price_note: translatePriceNote(area.parking_price_note),
    access_note: translateText(area.access_note),
  };
}

/**
 * @param {ReservationHint | null} hint
 * @param {Partial<ReservationHint> | undefined} localized
 * @returns {ReservationHint | null}
 */
function localizeReservationHint(hint, localized) {
  if (!hint) {
    return null;
  }

  return {
    ...hint,
    poi_name: localized?.poi_name ?? translatePlaceLabel(hint.poi_name),
    reminder_text: localized?.reminder_text ?? translateText(hint.reminder_text),
    reservation_channel:
      localized?.reservation_channel ??
      translateReservationChannel(hint.reservation_channel),
    price_note: localized?.price_note ?? translatePriceNote(hint.price_note),
    evidence_excerpt:
      localized?.evidence_excerpt ?? translateEvidenceExcerpt(hint.evidence_excerpt),
  };
}

/**
 * @param {string | null | undefined} label
 * @returns {string}
 */
function localizeGraphNodeLabel(label) {
  if (!label) {
    return "";
  }

  if (/^Day\s+\d+$/i.test(label)) {
    return label;
  }

  return translatePlaceLabel(label);
}

/**
 * @param {string | null | undefined} city
 * @returns {string}
 */
function translateCityField(city) {
  return formatPlanCityName(city, "en");
}

/**
 * @param {string | null | undefined} text
 * @returns {string}
 */
function translatePlaceLabel(text) {
  const normalized = normalizeText(text);
  return placeLabelTranslations[normalized] ?? normalized;
}

/**
 * @param {string | null | undefined} text
 * @returns {string}
 */
function translateText(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return "";
  }

  const exactTranslation = findExactTranslation(normalized);
  if (exactTranslation) {
    return exactTranslation;
  }

  if (placeLabelTranslations[normalized]) {
    return placeLabelTranslations[normalized];
  }

  if (reservationChannelTranslations[normalized]) {
    return reservationChannelTranslations[normalized];
  }

  if (transportStrategyTranslations[normalized]) {
    return transportStrategyTranslations[normalized];
  }

  if (travelPreferenceTranslations[normalized]) {
    return travelPreferenceTranslations[normalized];
  }

  if (normalized === "身份证") {
    return "ID card";
  }
  if (normalized === "学生证") {
    return "Student ID";
  }
  if (normalized === "充电宝") {
    return "Power bank";
  }
  if (normalized === "相机或额外存储卡") {
    return "Camera or extra storage";
  }
  if (normalized === "雨伞") {
    return "Umbrella";
  }
  if (normalized === "防晒霜") {
    return "Sunscreen";
  }
  if (normalized === "薄外套") {
    return "Light jacket";
  }

  if (!hasChineseCharacters(normalized)) {
    return normalized;
  }

  return normalized;
}

/**
 * @param {string | null | undefined} notes
 * @returns {string | null}
 */
function translateNotesBlock(notes) {
  const normalized = normalizeOptionalText(notes);
  if (!normalized) {
    return null;
  }

  const exactTranslation = findExactTranslation(normalized);
  if (exactTranslation) {
    return exactTranslation;
  }

  const parts = splitChineseSentences(normalized).map((part) => translateText(part));
  const translated = parts.filter(Boolean).join(" ");
  return translated || normalized;
}

/**
 * @param {string | null | undefined} summary
 * @returns {string}
 */
function translateWeatherConditionSummary(summary) {
  const normalized = normalizeText(summary);
  if (!normalized || !hasChineseCharacters(normalized)) {
    return normalized;
  }

  return normalized
    .split("->")
    .map((part) => translateWeatherLabel(part.trim()))
    .join(" -> ");
}

/**
 * @param {WeatherSummary} summary
 * @returns {string}
 */
function buildEnglishWeatherOverview(summary) {
  const condition = translateWeatherConditionSummary(summary.condition_summary);
  const temperature = formatTemperatureRange(summary);
  return `Forecast: ${condition}, ${temperature}.`;
}

/**
 * @param {string | null | undefined} tip
 * @returns {string | null}
 */
function translateClothingTip(tip) {
  const normalized = normalizeOptionalText(tip);
  if (!normalized) {
    return null;
  }

  const parts = splitChineseSentences(normalized).map((part) => translateText(part));
  return parts.filter(Boolean).join(" ");
}

/**
 * @param {string | null | undefined} headline
 * @returns {string}
 */
function translateExecutionHeadline(headline) {
  const normalized = normalizeText(headline);
  if (!normalized || !hasChineseCharacters(normalized)) {
    return normalized;
  }

  const translated = splitChineseSentences(normalized)
    .map((part) => executionHeadlineSegmentTranslations[part] ?? translateText(part))
    .filter(Boolean);

  return translated.join(". ") + (translated.length ? "." : "");
}

/**
 * @param {string | null | undefined} strategy
 * @returns {string}
 */
function translateTransportStrategy(strategy) {
  const normalized = normalizeText(strategy);
  return transportStrategyTranslations[normalized] ?? normalized;
}

/**
 * @param {string | null | undefined} item
 * @returns {string}
 */
function translateBestFor(item) {
  const normalized = normalizeText(item);
  if (travelPreferenceTranslations[normalized]) {
    return travelPreferenceTranslations[normalized];
  }

  const dayTripMatch = normalized.match(/^(\d+)\s*天城市旅行$/);
  if (dayTripMatch) {
    return `${dayTripMatch[1]}-day city trip`;
  }

  return normalized;
}

/**
 * @param {string | null | undefined} difficulty
 * @returns {string}
 */
function translateParkingDifficulty(difficulty) {
  const normalized = normalizeText(difficulty);
  return parkingDifficultyTranslations[normalized] ?? normalized;
}

/**
 * @param {string | null | undefined} channel
 * @returns {string | null}
 */
function translateReservationChannel(channel) {
  const normalized = normalizeOptionalText(channel);
  if (!normalized) {
    return null;
  }

  return reservationChannelTranslations[normalized] ?? normalized;
}

/**
 * @param {string | null | undefined} priceNote
 * @returns {string | null}
 */
function translatePriceNote(priceNote) {
  const normalized = normalizeOptionalText(priceNote);
  if (!normalized) {
    return null;
  }

  if (normalized === "免费") {
    return "Free";
  }

  if (exactTextTranslations[normalized]) {
    return exactTextTranslations[normalized];
  }

  const hourlyMatch = normalized.match(/^约\s*(\d+)\s*元\/小时$/);
  if (hourlyMatch) {
    return `About RMB ${hourlyMatch[1]}/hour`;
  }

  const rangeMatch = normalized.match(/^(\d+)\s*-\s*(\d+)\s*元\/小时$/);
  if (rangeMatch) {
    return `RMB ${rangeMatch[1]}-${rangeMatch[2]}/hour`;
  }

  if (normalized === "以现场公示为准") {
    return "Refer to on-site posted rates.";
  }

  if (!hasChineseCharacters(normalized)) {
    return normalized;
  }

  return normalized;
}

/**
 * @param {string | null | undefined} text
 * @returns {string}
 */
function translateEvidenceExcerpt(text) {
  return translateText(text);
}

/**
 * @param {string} label
 * @returns {string}
 */
function translateWeatherLabel(label) {
  const normalized = normalizeText(label);
  return weatherLabelTranslations[normalized] ?? normalized;
}

/**
 * @param {WeatherSummary} summary
 * @returns {string}
 */
function formatTemperatureRange(summary) {
  const low = summary.temperature_low_c;
  const high = summary.temperature_high_c;

  if (low === null && high === null) {
    return "temperature range unavailable";
  }

  if (low === null) {
    return `up to ${high}°C`;
  }

  if (high === null) {
    return `around ${low}°C`;
  }

  return `${low}-${high}°C`;
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function normalizeText(value) {
  return String(value ?? "").trim();
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function normalizeOptionalText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function hasChineseCharacters(text) {
  return /[\u3400-\u9fff]/u.test(text);
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function splitChineseSentences(text) {
  return text
    .split(/[；。]/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * @param {string} text
 * @returns {string | undefined}
 */
function findExactTranslation(text) {
  if (exactTextTranslations[text]) {
    return exactTextTranslations[text];
  }

  const normalized = text.replace(/[。；]$/u, "");
  return (
    exactTextTranslations[normalized] ??
    exactTextTranslations[`${normalized}。`] ??
    exactTextTranslations[`${normalized}；`]
  );
}
