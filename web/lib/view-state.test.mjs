import assert from "node:assert/strict";
import test from "node:test";

import {
  buildViewHref,
  readViewState,
} from "./view-state.js";

test("buildViewHref appends language and theme to a relative href", () => {
  assert.equal(
    buildViewHref("/plan/demo/share", {
      language: "en",
      theme: "dark",
    }),
    "/plan/demo/share?lang=en&theme=dark",
  );
});

test("buildViewHref preserves existing query params while overriding view state", () => {
  assert.equal(
    buildViewHref("/showcase/share?from=result&lang=zh-CN", {
      language: "en",
      theme: "light",
    }),
    "/showcase/share?from=result&lang=en&theme=light",
  );
});

test("buildViewHref preserves stage mode only when requested", () => {
  assert.equal(
    buildViewHref("/showcase?lang=zh-CN&theme=dark", {
      language: "zh-CN",
      theme: "dark",
      surface: "stage",
    }),
    "/showcase?lang=zh-CN&theme=dark&surface=stage",
  );

  assert.equal(
    buildViewHref("/showcase?lang=zh-CN&theme=dark&surface=stage", {
      language: "zh-CN",
      theme: "dark",
      surface: "default",
    }),
    "/showcase?lang=zh-CN&theme=dark",
  );
});

test("readViewState normalizes supported values from URLSearchParams", () => {
  const state = readViewState(
    new URLSearchParams("lang=en&theme=dark&surface=stage"),
    {
      language: "zh-CN",
      theme: "light",
      surface: "default",
    },
  );

  assert.deepEqual(state, {
    language: "en",
    theme: "dark",
    surface: "stage",
  });
});

test("readViewState falls back for invalid or missing values", () => {
  const state = readViewState(
    new URLSearchParams("lang=fr&theme=neon&surface=cinema"),
    {
      language: "zh-CN",
      theme: "light",
      surface: "default",
    },
  );

  assert.deepEqual(state, {
    language: "zh-CN",
    theme: "light",
    surface: "default",
  });
});

test("readViewState also accepts Next.js-style search param objects", () => {
  const state = readViewState(
    {
      lang: ["en", "zh-CN"],
      theme: "dark",
      surface: "stage",
    },
    {
      language: "zh-CN",
      theme: "light",
      surface: "default",
    },
  );

  assert.deepEqual(state, {
    language: "en",
    theme: "dark",
    surface: "stage",
  });
});
