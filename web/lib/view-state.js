export const DEFAULT_VIEW_LANGUAGE = "zh-CN";
export const DEFAULT_VIEW_THEME = "light";
export const DEFAULT_VIEW_SURFACE = "default";

const SUPPORTED_LANGUAGES = new Set([DEFAULT_VIEW_LANGUAGE, "en"]);
const SUPPORTED_THEMES = new Set([DEFAULT_VIEW_THEME, "dark"]);
const SUPPORTED_SURFACES = new Set([DEFAULT_VIEW_SURFACE, "stage"]);

export function buildViewHref(baseHref, viewState = {}) {
  const url = new URL(baseHref, "https://visitors.local");
  const language = normalizeViewLanguage(
    viewState.language,
    DEFAULT_VIEW_LANGUAGE,
  );
  const theme = normalizeViewTheme(viewState.theme, DEFAULT_VIEW_THEME);
  const surface = normalizeViewSurface(
    viewState.surface,
    DEFAULT_VIEW_SURFACE,
  );

  url.searchParams.set("lang", language);
  url.searchParams.set("theme", theme);
  if (surface === "stage") {
    url.searchParams.set("surface", surface);
  } else {
    url.searchParams.delete("surface");
  }

  const query = url.searchParams.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

export function readViewState(input, defaults = {}) {
  const params = toSearchParams(input);
  const fallbackLanguage = normalizeViewLanguage(
    defaults.language,
    DEFAULT_VIEW_LANGUAGE,
  );
  const fallbackTheme = normalizeViewTheme(defaults.theme, DEFAULT_VIEW_THEME);
  const fallbackSurface = normalizeViewSurface(
    defaults.surface,
    DEFAULT_VIEW_SURFACE,
  );

  return {
    language: normalizeViewLanguage(params.get("lang"), fallbackLanguage),
    theme: normalizeViewTheme(params.get("theme"), fallbackTheme),
    surface: normalizeViewSurface(params.get("surface"), fallbackSurface),
  };
}

export function normalizeViewLanguage(value, fallback = DEFAULT_VIEW_LANGUAGE) {
  return SUPPORTED_LANGUAGES.has(value) ? value : fallback;
}

export function normalizeViewTheme(value, fallback = DEFAULT_VIEW_THEME) {
  return SUPPORTED_THEMES.has(value) ? value : fallback;
}

export function normalizeViewSurface(value, fallback = DEFAULT_VIEW_SURFACE) {
  return SUPPORTED_SURFACES.has(value) ? value : fallback;
}

function toSearchParams(input) {
  if (input instanceof URLSearchParams) {
    return new URLSearchParams(input);
  }

  if (typeof input === "string") {
    return new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
  }

  const params = new URLSearchParams();
  if (!input || typeof input !== "object") {
    return params;
  }

  for (const [key, rawValue] of Object.entries(input)) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  return params;
}
