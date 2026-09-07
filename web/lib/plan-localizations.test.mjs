import assert from "node:assert/strict";
import test from "node:test";

import { localizePlanDraft } from "./plan-localizations.js";

const liveZhPlan = {
  id: "live-suzhou-demo",
  city: "Suzhou",
  days: 2,
  budget_min: 1600,
  budget_max: 2400,
  transport_preferences: ["drive", "metro"],
  entry_mode: "quick",
  travel_mode: "photo",
  preference_tags: ["food", "photo_ready"],
  parking_required: true,
  parking_sort: "distance",
  max_walk_from_parking_minutes: 30,
  stay_preference: "design_hotel",
  interest_tags: ["museum", "photo_spots"],
  special_requirements: "student discount preferred",
  xiaohongshu_link: "https://www.xiaohongshu.com/example",
  xiaohongshu_notes: "苏州博物馆需要提前预约，公众号预约。",
  output_language: "zh-CN",
  status: "draft",
  summary: "Museum-first citywalk plan with balanced pacing and reservation awareness.",
  timeline: [
    {
      day_index: 1,
      start_time: "09:00",
      end_time: "11:30",
      title: "苏州博物馆",
      transport_mode: "metro",
      transport_duration_minutes: 18,
      notes: "适合作为主行程节点，注意入场与停留时长。",
      reservation_hint: {
        poi_name: "苏州博物馆",
        reminder_text: "需要提前预约，公众号可完成实名预约。",
        reservation_channel: "公众号",
        price_note: "免费",
        source_url: "https://www.xiaohongshu.com/example",
        source_type: "xiaohongshu",
        confidence: 0.9,
        evidence_excerpt: "苏州博物馆需要提前预约，公众号预约。",
      },
    },
    {
      day_index: 1,
      start_time: "12:30",
      end_time: "15:00",
      title: "平江路",
      transport_mode: "walk",
      transport_duration_minutes: 15,
      notes: "适合慢节奏步行和拍照记录。",
      reservation_hint: null,
    },
  ],
  map_points: [
    {
      name: "苏州博物馆",
      lat: 31.3246,
      lng: 120.6171,
      day_index: 1,
      sequence_no: 1,
    },
    {
      name: "平江路",
      lat: 31.3197,
      lng: 120.6288,
      day_index: 1,
      sequence_no: 2,
    },
  ],
  budget_items: [
    {
      category: "tickets",
      amount_low: 128,
      amount_high: 288,
      is_adjustable: false,
    },
  ],
  checklist_items: [
    {
      category: "documents",
      item_name: "身份证",
      reason: "用于交通出行和酒店入住核验。",
    },
    {
      category: "photo",
      item_name: "相机或额外存储卡",
      reason: "适合拍照节点较多的行程。",
    },
    {
      category: "weather",
      item_name: "薄外套",
      reason: "晚间偏凉，或是昼夜温差会比较明显。",
    },
  ],
  weather_summary: {
    city_name: "苏州",
    condition_summary: "小雨 -> 多云",
    temperature_low_c: 18,
    temperature_high_c: 27,
    report_time: "2026-06-24 08:00:00",
    overview: "天气预计小雨 -> 多云，18-27°C。",
    clothing_tip:
      "建议带一件薄外套，应对早晚偏凉时段。 白天户外节点更适合短袖，并补充防晒。 转场时随身带一把折叠伞会更省事。",
    advisory_tags: ["rain", "sun", "layering"],
  },
  execution_summary: {
    headline: "这趟更适合上午先完成预约景点；下午再转入拍照和慢逛；遇到降雨时优先把室内点走完。",
    pace: "balanced",
    transport_strategy: "地铁 + 短距离步行",
    best_for: ["出片打卡", "周末 2 天"],
  },
  reservation_risks: [
    {
      poi_name: "苏州博物馆",
      severity: "high",
      reservation_channel: "公众号",
      price_note: "免费",
      evidence_excerpt: "苏州博物馆需要提前预约，公众号预约。",
    },
  ],
  parking_guides: [
    {
      poi_name: "苏州博物馆",
      parking_difficulty: "一般",
      recommended_lot_name: "苏州博物馆北停车场",
      walking_minutes: 6,
      price_note: "约 8 元/小时",
      sort_mode: "distance",
    },
  ],
  hotel_area_recommendations: [
    {
      area_name: "平江路东侧",
      parking_convenience: "停车场选择多，适合晚回酒店后步行补逛",
      parking_price_note: "商圈停车多为 6-8 元/小时",
      access_note: "去博物馆、平江路和双塔市集都比较顺路",
      suitable_modes: ["drive", "photo", "citywalk"],
      budget_band: "mid",
    },
  ],
  graph: {
    nodes: [
      { id: "city", label: "Suzhou", type: "city" },
      { id: "day-1", label: "Day 1", type: "day" },
      { id: "poi-1", label: "苏州博物馆", type: "attraction" },
      { id: "reservation-1", label: "苏州博物馆", type: "reservation" },
    ],
    edges: [
      { source: "city", target: "day-1", label: "contains" },
      { source: "day-1", target: "poi-1", label: "visit" },
      { source: "city", target: "reservation-1", label: "reserve" },
    ],
  },
  created_at: "2026-06-24T10:00:00.000Z",
  reservation_hints: [
    {
      poi_name: "苏州博物馆",
      reminder_text: "需要提前预约，公众号可完成实名预约。",
      reservation_channel: "公众号",
      price_note: "免费",
      source_url: "https://www.xiaohongshu.com/example",
      source_type: "xiaohongshu",
      confidence: 0.9,
      evidence_excerpt: "苏州博物馆需要提前预约，公众号预约。",
    },
  ],
};

test("localizePlanDraft translates structured live plan content into English", () => {
  const localized = localizePlanDraft(liveZhPlan, "en");

  assert.equal(localized.output_language, "en");
  assert.equal(localized.timeline[0].title, "Suzhou Museum");
  assert.equal(
    localized.timeline[0].notes,
    "Best used as a primary stop with controlled entry timing.",
  );
  assert.equal(localized.timeline[0].reservation_hint.poi_name, "Suzhou Museum");
  assert.equal(
    localized.timeline[0].reservation_hint.reservation_channel,
    "Official WeChat account",
  );
  assert.equal(localized.map_points[1].name, "Pingjiang Road");
  assert.equal(localized.checklist_items[0].item_name, "ID card");
  assert.equal(
    localized.checklist_items[1].reason,
    "Useful for photo-focused stops.",
  );
  assert.equal(localized.weather_summary.city_name, "Suzhou");
  assert.equal(localized.weather_summary.condition_summary, "Light rain -> Cloudy");
  assert.match(localized.weather_summary.clothing_tip, /light jacket/i);
  assert.equal(
    localized.execution_summary.headline,
    "Handle reservation-based stops earlier in the day. Leave the afternoon for photo-friendly stops and slower walks. Keep indoor stops ahead of exposed walking segments.",
  );
  assert.equal(
    localized.execution_summary.transport_strategy,
    "Metro + short walks",
  );
  assert.deepEqual(localized.execution_summary.best_for, [
    "Photo-focused stops",
    "Weekend 2-day trip",
  ]);
  assert.equal(localized.parking_guides[0].parking_difficulty, "Moderate");
  assert.equal(
    localized.parking_guides[0].recommended_lot_name,
    "Suzhou Museum North Parking Lot",
  );
  assert.equal(
    localized.hotel_area_recommendations[0].area_name,
    "East side of Pingjiang Road",
  );
  assert.equal(localized.graph.nodes[2].label, "Suzhou Museum");
  assert.equal(localized.reservation_hints[0].poi_name, "Suzhou Museum");
});
