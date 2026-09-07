import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlanSharePayload,
  buildReservationChecklistText,
  buildShareViewHref,
  buildTodayRouteText,
} from "./share-helpers.js";

const samplePlan = {
  id: "showcase-suzhou",
  city: "Suzhou",
  days: 2,
  budget_min: 1200,
  budget_max: 2000,
  transport_preferences: ["drive", "metro"],
  entry_mode: "xiaohongshu",
  travel_mode: "photo",
  preference_tags: ["food", "photo_ready", "night_view"],
  parking_required: true,
  parking_sort: "distance",
  max_walk_from_parking_minutes: 30,
  stay_preference: "boutique_hotel",
  interest_tags: ["museum", "photo_spots", "citywalk"],
  special_requirements: "优先学生优惠",
  xiaohongshu_link: "https://www.xiaohongshu.com/example",
  xiaohongshu_notes:
    "苏州博物馆虽然免费但是要提前很久预约，公众号预约。平江路更适合下午慢逛，夜景留到山塘街。",
  output_language: "zh-CN",
  status: "draft",
  summary: "以预约景点优先、出片节奏明确的 2 天苏州执行方案。",
  timeline: [
    {
      day_index: 1,
      start_time: "09:00",
      end_time: "11:30",
      title: "苏州博物馆",
      transport_mode: "metro",
      transport_duration_minutes: 20,
      notes: "上午先把需要预约的馆类点位走完，留出后半天给拍照和慢逛。",
      reservation_hint: {
        poi_name: "苏州博物馆",
        reminder_text: "需要提前预约，公众号可完成实名预约。",
        reservation_channel: "公众号",
        price_note: "免费",
        source_url: "https://www.xiaohongshu.com/example",
        source_type: "xiaohongshu",
        confidence: 0.9,
        evidence_excerpt: "虽然免费但是要提前预约，公众号预约。",
      },
    },
    {
      day_index: 1,
      start_time: "13:00",
      end_time: "15:30",
      title: "平江路",
      transport_mode: "walk",
      transport_duration_minutes: 15,
      notes: "把午后时段留给街巷慢逛和拍照。",
      reservation_hint: null,
    },
    {
      day_index: 2,
      start_time: "19:00",
      end_time: "21:00",
      title: "山塘街",
      transport_mode: "drive",
      transport_duration_minutes: 25,
      notes: "把夜景和收尾放到第二天晚上。",
      reservation_hint: null,
    },
  ],
  map_points: [],
  budget_items: [],
  checklist_items: [],
  weather_summary: null,
  execution_summary: {
    headline: "这趟更适合上午先完成预约景点，下午再转入拍照和慢逛。",
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
      evidence_excerpt: "虽然免费但是要提前预约，公众号预约。",
    },
  ],
  parking_guides: [],
  hotel_area_recommendations: [],
  graph: {
    nodes: [],
    edges: [],
  },
  created_at: "2026-06-24T10:00:00.000Z",
  reservation_hints: [],
};

test("buildPlanSharePayload localizes showcase content in English", () => {
  const payload = buildPlanSharePayload(
    samplePlan,
    "https://visitors.example/plan/demo",
    "en",
  );

  assert.equal(payload.title, "Suzhou 2-day travel plan");
  assert.match(payload.text, /reservation-heavy stop in the morning/);
  assert.match(payload.text, /Best for: Photo-ready check-ins \/ 2-day weekend escape/);
  assert.match(payload.text, /Day 1 route: 09:00 Suzhou Museum -> 13:00 Pingjiang Road/);
  assert.doesNotMatch(payload.text, /苏州博物馆|平江路|山塘街/);
  assert.equal(payload.url, "https://visitors.example/plan/demo");
});

test("buildPlanSharePayload formats the Chinese city label correctly", () => {
  const payload = buildPlanSharePayload(
    samplePlan,
    "https://visitors.example/plan/demo",
    "zh-CN",
  );

  assert.equal(payload.title, "苏州 2 天游玩计划");
  assert.match(payload.text, /苏州 2 天游玩路线/);
});

test("buildReservationChecklistText keeps Chinese content by default", () => {
  const text = buildReservationChecklistText(samplePlan);

  assert.match(text, /苏州预约清单/);
  assert.match(text, /风险等级：高/);
  assert.match(text, /渠道：公众号/);
  assert.match(text, /价格：免费/);
  assert.match(text, /证据摘录：虽然免费但是要提前预约，公众号预约。/);
});

test("buildReservationChecklistText localizes showcase content in English", () => {
  const text = buildReservationChecklistText(samplePlan, "en");

  assert.match(text, /Suzhou reservation checklist/);
  assert.match(text, /Risk level: High/);
  assert.match(text, /Channel: Official WeChat account/);
  assert.match(
    text,
    /Evidence: Free admission, but advance booking is required through the official WeChat account\./,
  );
  assert.doesNotMatch(text, /苏州博物馆|公众号/);
});

test("buildTodayRouteText only includes the requested day in the active language", () => {
  const text = buildTodayRouteText(samplePlan, 1, "en");

  assert.match(text, /Suzhou Day 1 route/);
  assert.match(text, /09:00-11:30 · Suzhou Museum · Metro · 20 min/);
  assert.match(text, /13:00-15:30 · Pingjiang Road · Walk · 15 min/);
  assert.doesNotMatch(text, /Shantang Street/);
  assert.doesNotMatch(text, /苏州博物馆|平江路|山塘街/);
});

test("buildShareViewHref switches between live plans and showcase", () => {
  assert.equal(buildShareViewHref("demo-plan", "live"), "/plan/demo-plan/share");
  assert.equal(
    buildShareViewHref("showcase-suzhou", "showcase"),
    "/showcase/share",
  );
});

test("buildShareViewHref can preserve the active language and theme", () => {
  assert.equal(
    buildShareViewHref("demo-plan", "live", {
      language: "en",
      theme: "dark",
    }),
    "/plan/demo-plan/share?lang=en&theme=dark",
  );
  assert.equal(
    buildShareViewHref("showcase-suzhou", "showcase", {
      language: "zh-CN",
      theme: "light",
    }),
    "/showcase/share?lang=zh-CN&theme=light",
  );
});
