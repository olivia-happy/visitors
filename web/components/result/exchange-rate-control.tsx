"use client";

import { formatExchangeRateMeta } from "@/lib/currency";
import type { ExchangeRateSnapshot, OutputLanguage } from "@/lib/schemas";

type ExchangeRateControlProps = {
  isRefreshing: boolean;
  language: OutputLanguage;
  onRefresh: () => void | Promise<void>;
  refreshStatus: "idle" | "success" | "error";
  snapshot: ExchangeRateSnapshot;
  variant?: "toolbar" | "hero";
};

export function ExchangeRateControl({
  isRefreshing,
  language,
  onRefresh,
  refreshStatus,
  snapshot,
  variant = "toolbar",
}: ExchangeRateControlProps) {
  const copy = formatExchangeRateMeta(language, snapshot);

  if (variant === "hero") {
    return (
      <section
        className="exchange-rate-panel"
        data-status={refreshStatus}
        data-variant="hero"
      >
        <div className="exchange-rate-panel-head">
          <span className="exchange-rate-panel-badge">{copy.badge}</span>
          <span className="exchange-rate-panel-date">{copy.detail}</span>
        </div>

        <div className="exchange-rate-panel-body">
          <div className="grid gap-2">
            <div className="grid gap-1">
              <h3 className="exchange-rate-panel-title">{copy.boardTitle}</h3>
              <p className="exchange-rate-panel-summary">{copy.summary}</p>
            </div>
            <p className="exchange-rate-panel-source">{copy.sourceDetail}</p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="exchange-rate-panel-action print:hidden"
            disabled={isRefreshing}
          >
            {isRefreshing ? copy.loadingLabel : copy.actionLabel}
          </button>
        </div>

        {refreshStatus !== "idle" ? (
          <span className="exchange-rate-panel-status print:hidden">
            {refreshStatus === "success"
              ? copy.successLabel
              : copy.errorLabel}
          </span>
        ) : null}
      </section>
    );
  }

  return (
    <div
      className="planner-toolbar-block min-w-0 exchange-rate-panel"
      data-variant="toolbar"
    >
      <span className="planner-control-label">{copy.badge}</span>
      <div className="exchange-rate-toolbar-row">
        <span className="planner-stamp" data-tone="soft">
          {copy.detail}
        </span>
        <span className="planner-stamp" data-tone="warm">
          {copy.summary}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          data-state="idle"
          className="planner-segment"
          disabled={isRefreshing}
        >
          {isRefreshing ? copy.loadingLabel : copy.actionLabel}
        </button>
      </div>
      {refreshStatus !== "idle" ? (
        <span className="exchange-rate-toolbar-status">
          {refreshStatus === "success"
            ? copy.successLabel
            : copy.errorLabel}
        </span>
      ) : null}
    </div>
  );
}
