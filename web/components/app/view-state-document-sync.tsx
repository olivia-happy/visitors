"use client";

import { useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";

import {
  DEFAULT_VIEW_LANGUAGE,
  normalizeViewLanguage,
} from "@/lib/view-state";

export function ViewStateDocumentSync() {
  const searchParams = useSearchParams();
  const language = normalizeViewLanguage(
    searchParams.get("lang"),
    DEFAULT_VIEW_LANGUAGE,
  );

  useLayoutEffect(() => {
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  return null;
}
