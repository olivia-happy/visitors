import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_VIEW_LANGUAGE,
  DEFAULT_VIEW_THEME,
  normalizeViewLanguage,
  normalizeViewTheme,
} from "@/lib/view-state";

export function proxy(request: NextRequest) {
  const nextHeaders = new Headers(request.headers);
  const language = normalizeViewLanguage(
    request.nextUrl.searchParams.get("lang"),
    DEFAULT_VIEW_LANGUAGE,
  );
  const theme = normalizeViewTheme(
    request.nextUrl.searchParams.get("theme"),
    DEFAULT_VIEW_THEME,
  );

  nextHeaders.set("x-visitors-lang", language);
  nextHeaders.set("x-visitors-theme", theme);

  return NextResponse.next({
    request: {
      headers: nextHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
