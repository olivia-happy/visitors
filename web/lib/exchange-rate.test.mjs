import assert from "node:assert/strict";
import test from "node:test";

import { buildUsdCnySnapshotFromEcbResponses } from "./exchange-rate.js";

test("buildUsdCnySnapshotFromEcbResponses reads the ECB observation date and computes the USD/CNY cross rate", () => {
  const usdResponse = {
    structure: {
      dimensions: {
        observation: {
          values: [{ id: "2026-06-29" }],
        },
      },
    },
    dataSets: [
      {
        series: {
          "0:0:0:0:0": {
            observations: {
              "0": [1.1406, 0, 0, null, null],
            },
          },
        },
      },
    ],
  };

  const cnyResponse = {
    structure: {
      dimensions: {
        observation: {
          values: [{ id: "2026-06-29" }],
        },
      },
    },
    dataSets: [
      {
        series: {
          "0:0:0:0:0": {
            observations: {
              "0": [7.7492, 0, 0, null, null],
            },
          },
        },
      },
    ],
  };

  const snapshot = buildUsdCnySnapshotFromEcbResponses(
    usdResponse,
    cnyResponse,
  );

  assert.equal(snapshot.rateDate, "2026-06-29");
  assert.equal(snapshot.sourceLabel, "ECB reference rates");
  assert.equal(
    snapshot.sourceUrl,
    "https://data-api.ecb.europa.eu/service/data/EXR",
  );
  assert.ok(Math.abs(snapshot.usdPerCny - 0.1471893872915914) < 1e-12);
  assert.ok(Math.abs(snapshot.cnyPerUsd - 6.793968086971769) < 1e-12);
});

test("buildUsdCnySnapshotFromEcbResponses also supports the live ECB jsondata shape", () => {
  const usdResponse = {
    structure: {
      dimensions: {
        observation: [
          {
            id: "TIME_PERIOD",
            values: [{ id: "2026-06-29" }],
          },
        ],
      },
    },
    dataSets: {
      series: {
        "0:0:0:0:0": {
          observations: {
            "0": [1.1406, 0, 0, null, null],
          },
        },
      },
    },
  };

  const cnyResponse = {
    structure: {
      dimensions: {
        observation: [
          {
            id: "TIME_PERIOD",
            values: [{ id: "2026-06-29" }],
          },
        ],
      },
    },
    dataSets: {
      series: {
        "0:0:0:0:0": {
          observations: {
            "0": [7.7492, 0, 0, null, null],
          },
        },
      },
    },
  };

  const snapshot = buildUsdCnySnapshotFromEcbResponses(
    usdResponse,
    cnyResponse,
  );

  assert.equal(snapshot.rateDate, "2026-06-29");
  assert.ok(Math.abs(snapshot.usdPerCny - 0.1471893872915914) < 1e-12);
});
