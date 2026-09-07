"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  startTransition,
  useLayoutEffect,
  useState,
} from "react";

import { StepBasics } from "@/components/intake/step-basics";
import { StepEvidence } from "@/components/intake/step-evidence";
import { StepStyle } from "@/components/intake/step-style";
import { createPlan, previewEvidence } from "@/lib/api";
import { formatBudgetAmount } from "@/lib/currency";
import {
  buildPlanPayload,
  getInitialWizardState,
  shouldShowParkingFields,
  validateCoreTripInputs,
} from "@/lib/intake-helpers";
import type {
  EvidencePreview,
  ExchangeRateSnapshot,
  OutputLanguage,
  PlanInput,
} from "@/lib/schemas";
import { buildViewHref } from "@/lib/view-state";

type EntryMode = "quick" | "xiaohongshu";
type DemoPreset = "suzhou";
type ResultSurfaceMode = "default" | "stage";
type TravelMode = "" | "photo" | "citywalk" | "nature" | "garden_culture";
type ParkingSort = "distance" | "price";
type ThemeMode = "light" | "dark";
type EvidencePreviewStatus = "idle" | "loading" | "ready" | "stale" | "error";

type WizardState = {
  currentStep: 1 | 2 | 3;
  entryMode: EntryMode;
  city: string;
  days: string;
  budgetMin: string;
  budgetMax: string;
  transportPreferences: string[];
  travelMode: TravelMode;
  preferenceTags: string[];
  interestTags: string[];
  stayPreference: string;
  specialRequirements: string;
  xiaohongshuLink: string;
  xiaohongshuNotes: string;
  outputLanguage: OutputLanguage;
  parkingSort: ParkingSort;
  maxWalkFromParkingMinutes: string;
};

type PlanWizardProps = {
  entryMode: EntryMode;
  demoPreset?: DemoPreset;
  exchangeRateSnapshot: ExchangeRateSnapshot;
  initialResultSurfaceMode?: ResultSurfaceMode;
};

type WizardFieldErrors = Partial<Record<"city" | "days", string>>;

type TextFieldName =
  | "city"
  | "days"
  | "budgetMin"
  | "budgetMax"
  | "stayPreference"
  | "specialRequirements"
  | "xiaohongshuLink"
  | "xiaohongshuNotes"
  | "maxWalkFromParkingMinutes";

type SelectFieldName = "travelMode" | "parkingSort";
type ArrayFieldName =
  | "transportPreferences"
  | "preferenceTags"
  | "interestTags";

type StepMeta = {
  id: 1 | 2 | 3;
  code: string;
  label: string;
  title: string;
  detail: string;
  side: string;
};

type UiCopy = {
  metaTitle: string;
  toolbar: {
    language: string;
    theme: string;
    languageZh: string;
    languageEn: string;
    light: string;
    dark: string;
  };
  hero: {
    kicker: string;
    entry: Record<EntryMode, string>;
    stamps: {
      mobile: string;
      bilingual: string;
      reservationAware: string;
    };
    heading: Record<EntryMode, [string, string]>;
    intro: Record<EntryMode, string>;
    flows: [string, string, string];
    primaryPath: {
      kicker: string;
      title: string;
      note: string;
      action: string;
      helper: string;
      points: [string, string, string];
    };
    previewKicker: string;
    previewNote: string;
    previewCards: Array<{
      code: string;
      title: string;
      body: string | Record<EntryMode, string>;
    }>;
  };
  steps: [StepMeta, StepMeta, StepMeta];
  rail: {
    kicker: string;
    note: string;
  };
  brief: {
    kicker: string;
    note: string;
    labels: {
      entry: string;
      city: string;
      budget: string;
      transport: string;
      style: string;
      evidence: string;
    };
    entryValue: Record<EntryMode, string>;
    pending: string;
    proofReady: string;
    proofPending: string;
  };
  module: {
    kicker: string;
    stepCounter: string;
    outputStamp: string;
  };
  navigation: {
    kicker: string;
    previous: string;
    next: string;
    submit: string;
    submitting: string;
    nextNote: string;
    submitNote: string;
  };
  errorMessage: string;
  outputStatus: string;
  transportLabels: Record<string, string>;
  travelModeLabels: Record<TravelMode, string>;
};

const copyByLanguage: Record<OutputLanguage, UiCopy> = {
  "zh-CN": {
    metaTitle: "访行计划",
    toolbar: {
      language: "语言",
      theme: "明暗",
      languageZh: "中",
      languageEn: "英",
      light: "☼ 明亮",
      dark: "☾ 暗色",
    },
    hero: {
      kicker: "行程输入",
      entry: {
        quick: "快速建方案入口",
        xiaohongshu: "证据优先入口",
      },
      stamps: {
        mobile: "适配手机",
        bilingual: "中英切换",
        reservationAware: "预约敏感",
      },
      heading: {
        quick: ["先把旅行工作台搭起来。", "再把预约与证据收紧。"],
        xiaohongshu: ["先把预约证据钉住。", "再把路线工作台搭起来。"],
      },
      intro: {
        quick:
          "这页不该像一张中性表单，而该像一块旅行控制台。先把城市、预算、交通和偏好钉住，再生成可执行到小时的路线。",
        xiaohongshu:
          "从小红书入口切进来时，系统要先抓住会影响执行的预约证据，再把路线、预算和地图视图一起收拢成可落地方案。",
      },
      flows: [
        "城市 → 路线边界",
        "偏好 → 节奏与风格",
        "证据 → 预约提醒卡",
      ],
      primaryPath: {
        kicker: "真实使用路径",
        title: "输入任意国内城市，再让系统补齐路线、预约、预算与地图。",
        note:
          "正式使用不依赖样例。先把你真正要去的城市填进去，下面三步再继续收紧交通、预算和偏好。",
        action: "直接输入城市",
        helper: "苏州仅保留作录屏与讲解样例。",
        points: ["任意国内城市", "小时级路线", "预算 + 预约 + 地图"],
      },
      previewKicker: "生成结果",
      previewNote:
        "最终产物应该是一张能直接照着走的城市旅行卡，而不是一次性的问卷结果。",
      previewCards: [
        {
          code: "01",
          title: "小时级时间轴",
          body: "按天、按时段拆开，生成真正可执行的路线，而不是泛泛的景点清单。",
        },
        {
          code: "02",
          title: "预约提醒卡",
          body: {
            quick:
              "把会影响执行的预约线索提前提炼出来，连同渠道、价格和证据摘录一起标清。",
            xiaohongshu:
              "从链接和摘录里提前抽取预约提示、预约渠道、价格与证据摘录。",
          },
        },
        {
          code: "03",
          title: "精准预算明细",
          body: "门票、餐饮、住宿、交通分别汇总，适合直接做预算判断。",
        },
        {
          code: "04",
          title: "地图与节点关系图",
          body: "地图距离感和节点关系图同步生成，不只给一段纯文本路线。",
        },
      ],
    },
    steps: [
      {
        id: 1,
        code: "01",
        label: "基础",
        title: "路线边界 / 城市、预算、交通",
        detail:
          "先把旅行边界钉住，系统才不会从空白开始胡乱拼路线。这里决定的是城市、天数、预算和交通骨架。",
        side: "城市 · 预算 · 交通",
      },
      {
        id: 2,
        code: "02",
        label: "风格",
        title: "路线语气 / 出片、漫游、自然、园林",
        detail:
          "这一段只收会改变路线气质的偏好。不是把所有需求一次塞满，而是先定这次旅行的主语气。",
        side: "模式 · 标签 · 住宿",
      },
      {
        id: 3,
        code: "03",
        label: "证据",
        title: "证据补钉 / 链接、摘录、预约线索",
        detail:
          "这里只收会影响执行判断的证据，让预约提醒、渠道信息和价格线索都能真正落到行程卡里。",
        side: "证据 · 渠道 · 价格",
      },
    ],
    rail: {
      kicker: "步骤轨 // 当前模块",
      note:
        "这不是普通步骤条，而是一条正在不断缩小输入范围的路线轨。每走一步，最终方案都应该更接近可执行。",
    },
    brief: {
      kicker: "即时摘要 // 当前输入",
      note:
        "用户每填一步，这张摘要就应该更清楚，而不是更杂乱。它要像一个随时更新的路线简报。",
      labels: {
        entry: "入口",
        city: "城市",
        budget: "预算",
        transport: "交通",
        style: "风格",
        evidence: "证据",
      },
      entryValue: {
        quick: "快速建方案入口",
        xiaohongshu: "小红书证据入口",
      },
      pending: "待补充",
      proofReady: "已补证据",
      proofPending: "待补证据",
    },
    module: {
      kicker: "当前模块",
      stepCounter: "第 {current} / 03 步",
      outputStamp: "中文输出",
    },
    navigation: {
      kicker: "提交板 // 下一步",
      previous: "上一步",
      next: "下一步",
      submit: "生成方案",
      submitting: "生成中…",
      nextNote: "继续往下收紧输入，不用一次填满全部字段。",
      submitNote:
        "提交后进入小时级路线卡、预算面板、预约提醒卡和地图视图。",
    },
    errorMessage: "生成方案失败。",
    outputStatus: "中文输出",
    transportLabels: {
      high_speed_rail: "高铁",
      metro: "地铁",
      drive: "自驾",
      taxi: "打车",
    },
    travelModeLabels: {
      "": "待补充",
      photo: "出片",
      citywalk: "城市漫游",
      nature: "自然",
      garden_culture: "园林",
    },
  },
  en: {
    metaTitle: "VisitFlow Planner",
    toolbar: {
      language: "Language",
      theme: "Theme",
      languageZh: "CN",
      languageEn: "EN",
      light: "☼ Light",
      dark: "☾ Dark",
    },
    hero: {
      kicker: "Plan Intake",
      entry: {
        quick: "Quick route start",
        xiaohongshu: "Evidence-first start",
      },
      stamps: {
        mobile: "Mobile-ready",
        bilingual: "CN / EN",
        reservationAware: "Reservation-aware",
      },
      heading: {
        quick: ["Frame the trip desk first.", "Then tighten the booking proof."],
        xiaohongshu: [
          "Pin down reservation proof first.",
          "Then shape the route desk around it.",
        ],
      },
      intro: {
        quick:
          "This page should feel like a travel desk, not a neutral form. Lock the city, budget, transport, and tone first, then generate an hour-level route you can actually follow.",
        xiaohongshu:
          "When the flow starts from Xiaohongshu, the planner should capture reservation-sensitive evidence first, then fold route, budget, and map decisions into one executable trip card.",
      },
      flows: [
        "City → route frame",
        "Tone → pace and style",
        "Proof → reservation card",
      ],
      primaryPath: {
        kicker: "Real path",
        title:
          "Enter any domestic city first, then let the system tighten route, alerts, budget, and map logic.",
        note:
          "The product is meant for real city input, not sample dependency. Start with the actual city, then narrow transport, budget, and tone in the next three steps.",
        action: "Jump to city input",
        helper: "Suzhou remains a recording and walkthrough sample only.",
        points: ["Any China city", "Hour-level route", "Budget + alerts + map"],
      },
      previewKicker: "Output Preview",
      previewNote:
        "The result should be a trip card you can act on immediately, not a one-off survey response.",
      previewCards: [
        {
          code: "01",
          title: "Hour-level timeline",
          body: "Break the plan down by day and time block so the route feels executable, not generic.",
        },
        {
          code: "02",
          title: "Reservation alerts",
          body: {
            quick:
              "Surface booking-sensitive clues early, with channel, price, and evidence excerpts attached.",
            xiaohongshu:
              "Pull reservation hints, booking channels, prices, and evidence excerpts directly from links and notes.",
          },
        },
        {
          code: "03",
          title: "Precise budget panel",
          body: "Separate tickets, food, stay, and transport into a real budget breakdown.",
        },
        {
          code: "04",
          title: "Map + node graph",
          body: "Generate spatial distance cues and a node relationship graph instead of plain text only.",
        },
      ],
    },
    steps: [
      {
        id: 1,
        code: "01",
        label: "Basics",
        title: "Route frame / city, budget, transport",
        detail:
          "Lock the trip boundaries first so the system is not improvising from blank space. This step sets the city, trip length, budget, and transport backbone.",
        side: "City · Budget · Transport",
      },
      {
        id: 2,
        code: "02",
        label: "Tone",
        title: "Route tone / photo, citywalk, nature, gardens",
        detail:
          "This step collects only the preferences that change the shape of the route. Pick the lead tone before filling every detail.",
        side: "Mode · Tags · Stay",
      },
      {
        id: 3,
        code: "03",
        label: "Proof",
        title: "Evidence patch / links, notes, reservation clues",
        detail:
          "Feed only the proof that changes execution. Reservation alerts, channel data, and price hints should land directly in the itinerary cards.",
        side: "Proof · Channel · Price",
      },
    ],
    rail: {
      kicker: "Route Track // Current Module",
      note:
        "This is not a generic progress bar. It is a narrowing route track, and every step should make the final plan more executable.",
    },
    brief: {
      kicker: "Live Brief // Current Input",
      note:
        "Each field should sharpen this brief, not clutter it. Think of it as a route memo that updates in real time.",
      labels: {
        entry: "Entry",
        city: "City",
        budget: "Budget",
        transport: "Transport",
        style: "Tone",
        evidence: "Proof",
      },
      entryValue: {
        quick: "Quick route start",
        xiaohongshu: "Xiaohongshu evidence start",
      },
      pending: "Pending",
      proofReady: "Proof added",
      proofPending: "Proof pending",
    },
    module: {
      kicker: "Current Module",
      stepCounter: "Step {current} / 03",
      outputStamp: "English output",
    },
    navigation: {
      kicker: "Action Bar // Next Move",
      previous: "Previous",
      next: "Next",
      submit: "Generate plan",
      submitting: "Generating…",
      nextNote: "Keep narrowing the input. You do not need to fill every field at once.",
      submitNote:
        "Submit to move into the route card, budget panel, reservation alerts, and map view.",
    },
    errorMessage: "Failed to generate the plan.",
    outputStatus: "English output",
    transportLabels: {
      high_speed_rail: "High-speed rail",
      metro: "Metro",
      drive: "Drive",
      taxi: "Taxi",
    },
    travelModeLabels: {
      "": "Pending",
      photo: "Photo-led",
      citywalk: "Citywalk",
      nature: "Nature",
      garden_culture: "Gardens",
    },
  },
};

const demoCopyByLanguage: Record<
  OutputLanguage,
  {
    kicker: string;
    note: string;
    manualNote: string;
    fillEyebrow: string;
    fillLabel: string;
    fillNote: string;
    previewEyebrow: string;
    previewLabel: string;
    previewNote: string;
  }
> = {
  "zh-CN": {
    kicker: "演示样例 // 次级入口",
    note: "需要录屏或快速讲解时，再加载苏州样例；提交流程和成片展示都保留。",
    manualNote:
      "真实使用时仍然先手动输入任意国内城市，苏州样例只是一条演示快捷入口。",
    fillEyebrow: "A01 // 示例预填",
    fillLabel: "填充苏州样例",
    fillNote: "保留真实提交流程，适合录完整产品链路。",
    previewEyebrow: "A02 // 成片预览",
    previewLabel: "直接看成片",
    previewNote: "跳到现成展示页，适合截图、讲解和快速预览。",
  },
  en: {
    kicker: "Showcase demo // secondary path",
    note:
      "Use the Suzhou sample only when you need a recording shortcut or a fast walkthrough. The real flow still starts from manual city input.",
    manualNote:
      "Any domestic city can still be entered manually in the city field. The Suzhou sample is only a demo shortcut.",
    fillEyebrow: "A01 // Demo fill",
    fillLabel: "Load Suzhou sample",
    fillNote: "Keep the real submit flow for a full product demo.",
    previewEyebrow: "A02 // Showcase",
    previewLabel: "View polished sample",
    previewNote: "Jump straight to the showcase page for screenshots and walkthroughs.",
  },
};

export function PlanWizard({
  entryMode,
  demoPreset,
  exchangeRateSnapshot,
  initialResultSurfaceMode = "default",
}: PlanWizardProps) {
  const router = useRouter();
  const [values, setValues] = useState<WizardState>(
    () =>
      getInitialWizardState({
        entryMode,
        preset: demoPreset,
      }) as WizardState,
  );
  const [uiLanguage, setUiLanguage] = useState<OutputLanguage>("zh-CN");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [resultSurfaceMode, setResultSurfaceMode] =
    useState<ResultSurfaceMode>(initialResultSurfaceMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({});
  const [evidencePreview, setEvidencePreview] =
    useState<EvidencePreview | null>(null);
  const [evidencePreviewStatus, setEvidencePreviewStatus] =
    useState<EvidencePreviewStatus>("idle");
  const [evidencePreviewError, setEvidencePreviewError] = useState("");

  const copy = copyByLanguage[uiLanguage];
  const demoCopy = demoCopyByLanguage[uiLanguage];
  const currentStepMeta = copy.steps[values.currentStep - 1];
  const parkingVisible = shouldShowParkingFields(values.transportPreferences);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const syncDocumentChrome = () => {
      if (root.getAttribute("lang") !== uiLanguage) {
        root.setAttribute("lang", uiLanguage);
      }
      if (document.title !== copy.metaTitle) {
        document.title = copy.metaTitle;
      }
    };

    syncDocumentChrome();

    const frame = window.requestAnimationFrame(syncDocumentChrome);
    const observer = new MutationObserver(syncDocumentChrome);
    observer.observe(root, {
      attributeFilter: ["lang"],
      attributes: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [copy.metaTitle, uiLanguage]);

  const transportSummary = values.transportPreferences.length
    ? values.transportPreferences
        .map((item) => copy.transportLabels[item] ?? item)
        .join(" / ")
    : copy.brief.pending;

  const proofSummary =
    evidencePreviewStatus === "ready" && evidencePreview
      ? uiLanguage === "en"
        ? `${evidencePreview.reservation_hints.length} parsed`
        : `已解析 ${evidencePreview.reservation_hints.length} 条`
      : values.xiaohongshuLink || values.xiaohongshuNotes
      ? copy.brief.proofReady
      : copy.brief.proofPending;
  const budgetSummary =
    values.budgetMin || values.budgetMax
      ? buildBudgetDraftSummary(
          values.budgetMin,
          values.budgetMax,
          uiLanguage,
          exchangeRateSnapshot,
        )
      : copy.brief.pending;
  const routeIdentity = buildRouteIdentity({
    copy,
    budgetSummary,
    entryMode,
    language: uiLanguage,
    parkingVisible,
    proofSummary,
    transportSummary,
    values,
  });

  const liveBrief = [
    {
      label: copy.brief.labels.entry,
      value: copy.brief.entryValue[entryMode],
    },
    {
      label: copy.brief.labels.city,
      value: values.city || copy.brief.pending,
    },
    {
      label: copy.brief.labels.budget,
      value: budgetSummary,
    },
    {
      label: copy.brief.labels.transport,
      value: transportSummary,
    },
    {
      label: copy.brief.labels.style,
      value: copy.travelModeLabels[values.travelMode],
    },
    {
      label: copy.brief.labels.evidence,
      value: proofSummary,
    },
  ];

  function updateTextField(name: TextFieldName, value: string) {
    if (error) {
      setError("");
    }
    if (name === "xiaohongshuLink" || name === "xiaohongshuNotes") {
      setEvidencePreviewError("");
      setEvidencePreviewStatus((current) =>
        current === "ready" ? "stale" : current,
      );
    }
    if ((name === "city" || name === "days") && fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: undefined }));
    }
    setValues((current) => ({ ...current, [name]: value }));
  }

  function updateSelectField(name: SelectFieldName, value: string) {
    if (error) {
      setError("");
    }
    setValues((current) => ({ ...current, [name]: value }));
  }

  function toggleListValue(name: ArrayFieldName, value: string) {
    if (error) {
      setError("");
    }
    setValues((current) => {
      const hasValue = current[name].includes(value);
      return {
        ...current,
        [name]: hasValue
          ? current[name].filter((item) => item !== value)
          : [...current[name], value],
      };
    });
  }

  function setCurrentStep(step: 1 | 2 | 3) {
    setValues((current) => ({ ...current, currentStep: step }));
  }

  function handleLanguageChange(nextLanguage: OutputLanguage) {
    setUiLanguage(nextLanguage);
    setEvidencePreviewStatus((current) =>
      current === "ready" ? "stale" : current,
    );
    setValues((current) => ({
      ...current,
      outputLanguage: nextLanguage,
    }));
  }

  function handleApplyDemoPreset() {
    setError("");
    setEvidencePreview(null);
    setEvidencePreviewError("");
    setEvidencePreviewStatus("idle");
    setResultSurfaceMode("stage");
    setValues(
      getInitialWizardState({
        entryMode,
        outputLanguage: uiLanguage,
        preset: demoPreset ?? "suzhou",
      }) as WizardState,
    );
  }

  function handleOpenShowcase() {
    startTransition(() => {
      router.push(
        buildViewHref("/showcase", {
          language: uiLanguage,
          surface: "stage",
          theme: themeMode,
        }),
      );
    });
  }

  function handleJumpToCityInput() {
    setCurrentStep(1);
    focusPlannerField("planner-city-input");
  }

  async function handlePreviewEvidence() {
    setEvidencePreviewStatus("loading");
    setEvidencePreviewError("");

    try {
      const preview = await previewEvidence({
        xiaohongshu_link: values.xiaohongshuLink.trim() || null,
        xiaohongshu_notes: values.xiaohongshuNotes.trim() || null,
        output_language: uiLanguage,
      });
      setEvidencePreview(preview);
      setEvidencePreviewStatus("ready");
    } catch (previewError) {
      setEvidencePreviewStatus("error");
      setEvidencePreviewError(
        previewError instanceof Error
          ? previewError.message
          : copy.errorMessage,
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.currentStep < 3) {
      const validation = validateCoreTripInputs(values, uiLanguage);

      if (values.currentStep === 1) {
        setFieldErrors(validation.fieldErrors as WizardFieldErrors);
      }

      if (
        values.currentStep === 1 &&
        (validation.fieldErrors.city || validation.fieldErrors.days)
      ) {
        setError(validation.fieldErrors.city ?? validation.fieldErrors.days ?? "");
        focusPlannerField(
          validation.fieldErrors.city
            ? "planner-city-input"
            : "planner-days-input",
        );
        return;
      }

      if (validation.formError) {
        setError(validation.formError);
        return;
      }

      setCurrentStep((values.currentStep + 1) as 1 | 2 | 3);
      return;
    }

    setError("");
    setIsSubmitting(true);
    const validation = validateCoreTripInputs(values, uiLanguage);
    setFieldErrors(validation.fieldErrors as WizardFieldErrors);

    if (validation.fieldErrors.city || validation.fieldErrors.days) {
      setIsSubmitting(false);
      setCurrentStep(1);
      setError(validation.fieldErrors.city ?? validation.fieldErrors.days ?? "");
      focusPlannerField(
        validation.fieldErrors.city ? "planner-city-input" : "planner-days-input",
      );
      return;
    }

    if (validation.formError) {
      setIsSubmitting(false);
      setCurrentStep(1);
      setError(validation.formError);
      return;
    }

    try {
      const payload = buildPlanPayload(values) as PlanInput;
      const plan = await createPlan(payload);
      startTransition(() => {
        router.push(
          buildViewHref(`/plan/${plan.id}`, {
            language: values.outputLanguage,
            surface: resultSurfaceMode,
            theme: themeMode,
          }),
        );
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : copy.errorMessage,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="planner-root planner-surface min-h-screen px-4 py-4 text-foreground sm:px-6 sm:py-6"
      data-theme={themeMode}
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-4">
        <header className="planner-hero rounded-[2rem] px-5 py-5 sm:px-7 sm:py-6 xl:px-8 xl:py-7">
          <div className="planner-toolbar">
            <div className="grid gap-3">
              <p className="planner-kicker">
                {copy.hero.kicker} {"//"} {copy.hero.entry[entryMode]}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="planner-stamp">{copy.hero.stamps.mobile}</span>
                <span className="planner-stamp" data-tone="soft">
                  {copy.hero.stamps.bilingual}
                </span>
                <span className="planner-stamp" data-tone="warm">
                  {copy.hero.stamps.reservationAware}
                </span>
              </div>
            </div>

            <div className="planner-toolbar-actions">
              <div className="planner-toolbar-block">
                <span className="planner-control-label">
                  {copy.toolbar.language}
                </span>
                <div className="planner-control-group">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("zh-CN")}
                    data-state={uiLanguage === "zh-CN" ? "active" : "idle"}
                    className="planner-segment"
                    aria-pressed={uiLanguage === "zh-CN"}
                  >
                    {copy.toolbar.languageZh}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("en")}
                    data-state={uiLanguage === "en" ? "active" : "idle"}
                    className="planner-segment"
                    aria-pressed={uiLanguage === "en"}
                  >
                    {copy.toolbar.languageEn}
                  </button>
                </div>
              </div>

              <div className="planner-toolbar-block">
                <span className="planner-control-label">{copy.toolbar.theme}</span>
                <div className="planner-control-group">
                  <button
                    type="button"
                    onClick={() => setThemeMode("light")}
                    data-state={themeMode === "light" ? "active" : "idle"}
                    className="planner-segment"
                    aria-pressed={themeMode === "light"}
                  >
                    {copy.toolbar.light}
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode("dark")}
                    data-state={themeMode === "dark" ? "active" : "idle"}
                    className="planner-segment"
                    aria-pressed={themeMode === "dark"}
                  >
                    {copy.toolbar.dark}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(19rem,0.84fr)] xl:items-stretch">
            <div className="planner-intake-stack">
              <div className="grid gap-3">
                <h1 className="planner-display planner-display-intake max-w-[36rem]">
                  {copy.hero.heading[entryMode].map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </h1>

                <p className="planner-copy max-w-[35rem]">
                  {copy.hero.intro[entryMode]}
                </p>
              </div>

              <section className="planner-primary-card planner-primary-card-launch">
                <div className="planner-primary-grid planner-primary-grid-launch">
                  <div className="grid gap-2.5">
                    <div className="grid gap-2">
                      <p className="planner-kicker">{copy.hero.primaryPath.kicker}</p>
                      <h2 className="planner-priority-title">
                        {copy.hero.primaryPath.title}
                      </h2>
                      <p className="planner-note max-w-[34rem]">
                        {copy.hero.primaryPath.note}
                      </p>
                    </div>

                    <div className="planner-priority-points">
                      {copy.hero.primaryPath.points.map((point) => (
                        <span key={point} className="planner-priority-pill">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="planner-primary-cta planner-primary-cta-launch">
                    <button
                      type="button"
                      onClick={handleJumpToCityInput}
                      className="planner-priority-button"
                    >
                      <span>{copy.hero.primaryPath.action}</span>
                      <span aria-hidden="true">↘</span>
                    </button>
                    <p className="planner-priority-helper">
                      {copy.hero.primaryPath.helper}
                    </p>
                  </div>
                </div>
              </section>

              <section className="planner-workbench-card">
                <div className="planner-workbench-head">
                  <div className="grid gap-1">
                    <p className="planner-kicker">{routeIdentity.kicker}</p>
                    <h2 className="planner-workbench-title">
                      {routeIdentity.title}
                    </h2>
                    <p className="planner-note max-w-[35rem]">
                      {routeIdentity.note}
                    </p>
                  </div>

                  <div className="planner-rule max-w-28" />
                </div>

                <div className="planner-workbench-grid">
                  <div className="planner-workbench-flow-list">
                    {copy.hero.flows.map((flow, index) => (
                      <article key={flow} className="planner-workbench-flow-item">
                        <span className="planner-workbench-flow-code">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="planner-workbench-flow-text">{flow}</span>
                      </article>
                    ))}
                  </div>

                  <div className="planner-signal-ribbon planner-signal-ribbon-workbench">
                    {routeIdentity.ribbon.map((item) => (
                      <article key={item.label} className="planner-signal-card">
                        <span className="planner-signal-label">{item.label}</span>
                        <span className="planner-signal-value">{item.value}</span>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <aside className="planner-preview xl:min-h-full">
              <section className="planner-identity-board">
                <div className="grid gap-1">
                  <p className="planner-kicker">{routeIdentity.kicker}</p>
                  <h2 className="planner-identity-title">{routeIdentity.title}</h2>
                  <p className="planner-note">{routeIdentity.note}</p>
                </div>

                <div className="planner-identity-grid">
                  {routeIdentity.signals.map((signal) => (
                    <article
                      key={`${signal.eyebrow}-${signal.title}`}
                      className="planner-identity-tile"
                      data-tone={signal.tone}
                    >
                      <span className="planner-identity-eyebrow">
                        {signal.eyebrow}
                      </span>
                      <span className="planner-identity-focus">
                        {signal.title}
                      </span>
                      <span className="planner-identity-copy">
                        {signal.copy}
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="planner-demo-strip">
                <div className="planner-demo-copy">
                  <p className="planner-kicker">{demoCopy.kicker}</p>
                  <p className="planner-note">{demoCopy.note}</p>
                  <p className="planner-note">{demoCopy.manualNote}</p>
                </div>

                <div className="planner-demo-actions">
                  <button
                    type="button"
                    onClick={handleApplyDemoPreset}
                    data-state={resultSurfaceMode === "stage" ? "soft" : "idle"}
                    className="planner-demo-card"
                  >
                    <span className="planner-demo-eyebrow">{demoCopy.fillEyebrow}</span>
                    <span className="planner-demo-title">{demoCopy.fillLabel}</span>
                    <span className="planner-demo-note">{demoCopy.fillNote}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenShowcase}
                    data-state="soft"
                    className="planner-demo-card"
                  >
                    <span className="planner-demo-eyebrow">
                      {demoCopy.previewEyebrow}
                    </span>
                    <span className="planner-demo-title">
                      {demoCopy.previewLabel}
                    </span>
                    <span className="planner-demo-note">{demoCopy.previewNote}</span>
                  </button>
                </div>
              </section>

              <div className="grid gap-1">
                <p className="planner-kicker">
                  {copy.hero.previewKicker} {"//"} {copy.navigation.submit}
                </p>
                <p className="planner-note">{copy.hero.previewNote}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {copy.hero.previewCards.map((card) => (
                  <article key={card.code} className="planner-tile">
                    <p className="planner-tile-code">{card.code}</p>
                    <h2 className="planner-tile-title">{card.title}</h2>
                    <p className="planner-tile-copy">
                      {typeof card.body === "string"
                        ? card.body
                        : card.body[entryMode]}
                    </p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </header>

        <section className="planner-shell rounded-[2rem] px-3 py-3 sm:px-4 sm:py-4 xl:px-5 xl:py-5">
          <form
            className="grid gap-4 xl:grid-cols-[16.75rem_minmax(0,1fr)] xl:items-start"
            onSubmit={handleSubmit}
          >
            <aside className="hidden xl:grid xl:sticky xl:top-5 xl:gap-4">
              <section className="planner-rail-card">
                <div className="grid gap-1">
                  <p className="planner-kicker">{copy.rail.kicker}</p>
                  <p className="planner-note">{copy.rail.note}</p>
                </div>

                <div className="grid gap-2">
                  {copy.steps.map((step) => {
                    const isActive = values.currentStep === step.id;
                    const isComplete = values.currentStep > step.id;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setCurrentStep(step.id)}
                        aria-current={isActive ? "step" : undefined}
                        data-state={
                          isActive ? "active" : isComplete ? "complete" : "idle"
                        }
                        className="planner-rail-step"
                      >
                        <span className="planner-rail-index">
                          {step.code} {"//"} {step.label}
                        </span>
                        <span className="planner-rail-title">{step.title}</span>
                        <span className="planner-rail-copy">{step.side}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="planner-rail-card" data-tone="dark">
                <div className="grid gap-1">
                  <p className="planner-kicker text-white/70">
                    {copy.brief.kicker}
                  </p>
                  <p className="planner-note text-white/70">{copy.brief.note}</p>
                </div>

                <div className="grid gap-3">
                  {liveBrief.map((item) => (
                    <div key={item.label} className="planner-brief-row">
                      <span className="planner-brief-label">{item.label}</span>
                      <span className="planner-brief-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>

            <div className="grid gap-4 pb-24 sm:pb-28">
              <section className="planner-sheet">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid gap-1.5">
                    <p className="planner-kicker">
                      {copy.module.kicker} {"//"} {currentStepMeta.code}
                    </p>
                    <h2 className="planner-section-title">
                      {currentStepMeta.title}
                    </h2>
                    <p className="planner-section-copy max-w-3xl">
                      {currentStepMeta.detail}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:max-w-[18rem] sm:justify-end">
                    <span className="planner-stamp">
                      {copy.module.stepCounter.replace(
                        "{current}",
                        String(values.currentStep),
                      )}
                    </span>
                    <span className="planner-stamp" data-tone="soft">
                      {copy.outputStatus}
                    </span>
                    <span className="planner-stamp" data-tone="warm">
                      {proofSummary}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 xl:hidden">
                  {copy.steps.map((step) => {
                    const isActive = values.currentStep === step.id;
                    const isComplete = values.currentStep > step.id;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setCurrentStep(step.id)}
                        aria-current={isActive ? "step" : undefined}
                        data-state={
                          isActive ? "active" : isComplete ? "soft" : "idle"
                        }
                        className="planner-choice grid min-h-[4.2rem] gap-1 rounded-[0.95rem] px-2.5 py-2.5 text-left"
                      >
                        <span className="text-[0.61rem] font-semibold uppercase tracking-[0.22em]">
                          {step.code} {"//"}
                        </span>
                        <span className="text-[0.73rem] font-semibold">
                          {step.label}
                        </span>
                        <span className="text-[0.61rem] leading-4 opacity-72">
                          {step.side}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <section className="planner-mobile-brief xl:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <p className="planner-kicker">{copy.brief.kicker}</p>
                      <p className="planner-note">{copy.brief.note}</p>
                    </div>
                    <span className="planner-stamp">
                      {copy.module.stepCounter.replace(
                        "{current}",
                        String(values.currentStep),
                      )}
                    </span>
                  </div>

                  <div className="planner-mobile-brief-grid">
                    {liveBrief.map((item) => (
                      <div key={item.label} className="planner-mobile-brief-item">
                        <span className="planner-mobile-brief-label">
                          {item.label}
                        </span>
                        <span className="planner-mobile-brief-value">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </section>

              {values.currentStep === 1 ? (
                <StepBasics
                  language={uiLanguage}
                  city={values.city}
                  days={values.days}
                  budgetMin={values.budgetMin}
                  budgetMax={values.budgetMax}
                  transportPreferences={values.transportPreferences}
                  parkingSort={values.parkingSort}
                  maxWalkFromParkingMinutes={values.maxWalkFromParkingMinutes}
                  outputLanguage={values.outputLanguage}
                  showParkingFields={parkingVisible}
                  fieldErrors={fieldErrors}
                  onFieldChange={updateTextField}
                  onSelectChange={updateSelectField}
                  onToggleTransport={(value) =>
                    toggleListValue("transportPreferences", value)
                  }
                />
              ) : null}

              {values.currentStep === 2 ? (
                <StepStyle
                  language={uiLanguage}
                  travelMode={values.travelMode}
                  preferenceTags={values.preferenceTags}
                  interestTags={values.interestTags}
                  stayPreference={values.stayPreference}
                  specialRequirements={values.specialRequirements}
                  onFieldChange={updateTextField}
                  onTravelModeChange={(value) =>
                    updateSelectField("travelMode", value)
                  }
                  onTogglePreferenceTag={(value) =>
                    toggleListValue("preferenceTags", value)
                  }
                  onToggleInterestTag={(value) =>
                    toggleListValue("interestTags", value)
                  }
                />
              ) : null}

              {values.currentStep === 3 ? (
                <StepEvidence
                  language={uiLanguage}
                  entryMode={values.entryMode}
                  xiaohongshuLink={values.xiaohongshuLink}
                  xiaohongshuNotes={values.xiaohongshuNotes}
                  preview={evidencePreview}
                  previewStatus={evidencePreviewStatus}
                  previewError={evidencePreviewError}
                  onPreviewEvidence={handlePreviewEvidence}
                  onFieldChange={updateTextField}
                />
              ) : null}

              {error ? (
                <p className="rounded-[1rem] border border-red-300 bg-red-50 px-3.5 py-3 text-[0.82rem] text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="sticky bottom-2 z-20">
                <div className="planner-bottom-bar flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4">
                  <div className="hidden min-w-0 flex-1 sm:grid">
                    <p className="planner-kicker">{copy.navigation.kicker}</p>
                    <p className="planner-bottom-meta">
                      {values.currentStep < 3
                        ? copy.navigation.nextNote
                        : copy.navigation.submitNote}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep(
                        Math.max(1, values.currentStep - 1) as 1 | 2 | 3,
                      )
                    }
                    disabled={values.currentStep === 1 || isSubmitting}
                    className="planner-bottom-button inline-flex min-h-9 flex-1 items-center justify-center rounded-full px-4 text-[0.74rem] font-semibold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:min-w-32"
                  >
                    {copy.navigation.previous}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    data-tone="primary"
                    className="planner-bottom-button inline-flex min-h-9 flex-[1.18] items-center justify-center rounded-full px-4 text-[0.74rem] font-semibold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-44"
                  >
                    {values.currentStep < 3
                      ? copy.navigation.next
                      : isSubmitting
                        ? copy.navigation.submitting
                        : copy.navigation.submit}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function focusPlannerField(fieldId: "planner-city-input" | "planner-days-input") {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const field = document.getElementById(fieldId);
      if (!(field instanceof HTMLInputElement)) {
        return;
      }

      field.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      field.focus({ preventScroll: true });
    });
  });
}

function buildBudgetDraftSummary(
  budgetMin: string,
  budgetMax: string,
  language: OutputLanguage,
  exchangeRateSnapshot: ExchangeRateSnapshot,
) {
  const low =
    budgetMin.trim() === "" ? Number.NaN : Number(budgetMin);
  const high =
    budgetMax.trim() === "" ? Number.NaN : Number(budgetMax);
  const lowLabel = Number.isFinite(low)
    ? formatBudgetAmount(low, language, exchangeRateSnapshot)
    : language === "en"
      ? "$?"
      : "￥?";
  const highLabel = Number.isFinite(high)
    ? formatBudgetAmount(high, language, exchangeRateSnapshot)
    : language === "en"
      ? "$?"
      : "￥?";

  return `${lowLabel} - ${highLabel}`;
}

function buildRouteIdentity({
  budgetSummary,
  copy,
  entryMode,
  language,
  parkingVisible,
  proofSummary,
  transportSummary,
  values,
}: {
  budgetSummary: string;
  copy: UiCopy;
  entryMode: EntryMode;
  language: OutputLanguage;
  parkingVisible: boolean;
  proofSummary: string;
  transportSummary: string;
  values: WizardState;
}) {
  const city = values.city || (language === "en" ? "This city" : "这座城市");
  const days = values.days || (language === "en" ? "days pending" : "天数待补");
  const tone = copy.travelModeLabels[values.travelMode];
  const parkingSignal = parkingVisible
    ? language === "en"
      ? "Parking shapes the route"
      : "停车会直接改路线"
    : language === "en"
      ? "No drive constraint"
      : "当前不是自驾约束";

  const title =
    values.travelMode === "photo"
      ? language === "en"
        ? `${city} photo execution line`
        : `${city} 出片执行线`
      : values.travelMode === "citywalk"
        ? language === "en"
          ? `${city} citywalk edit`
          : `${city} 慢逛执行线`
        : values.travelMode === "nature"
          ? language === "en"
            ? `${city} nature reset line`
            : `${city} 自然留白线`
          : values.travelMode === "garden_culture"
            ? language === "en"
              ? `${city} gardens and culture line`
              : `${city} 园林人文线`
            : entryMode === "xiaohongshu"
              ? language === "en"
                ? `${city} reservation-first route shell`
                : `${city} 预约优先方案`
              : language === "en"
                ? `${city} trip control shell`
                : `${city} 行程控制骨架`;

  const note =
    language === "en"
      ? `${days}, ${transportSummary.toLowerCase()}, and ${tone.toLowerCase()} are already shaping the route personality.`
      : `${days}、${transportSummary} 和 ${tone} 已经开始决定这条路线的执行气质。`;

  return {
    kicker:
      language === "en"
        ? "Route identity // live desk"
        : "路线身份 // 实时控制台",
    title,
    note,
    ribbon: [
      {
        label: language === "en" ? "Entry" : "入口",
        value: copy.brief.entryValue[entryMode],
      },
      {
        label: language === "en" ? "Tone" : "风格",
        value: tone,
      },
      {
        label: language === "en" ? "Constraint" : "约束",
        value: parkingVisible
          ? language === "en"
            ? "Drive + parking"
            : "自驾 + 停车"
          : language === "en"
            ? "Light route"
            : "轻量路线",
      },
    ],
    signals: [
      {
        eyebrow: language === "en" ? "Route frame" : "路线边界",
        title: language === "en" ? `${city} · ${days}` : `${city} · ${days}`,
        copy:
          language === "en"
            ? "The city and duration are fixed before the system starts improvising."
            : "先把城市和天数钉住，路线才不会从空白里乱长。",
        tone: "soft",
      },
      {
        eyebrow: language === "en" ? "Transport stack" : "交通堆栈",
        title: transportSummary,
        copy:
          language === "en"
            ? "This backbone decides whether the route stays dense, light, or parking-sensitive."
            : "它决定路线是更紧凑、更轻，还是更受停车条件影响。",
        tone: "line",
      },
      {
        eyebrow: language === "en" ? "Execution signal" : "执行信号",
        title: budgetSummary,
        copy:
          language === "en"
            ? `${proofSummary}. ${parkingSignal}`
            : `${proofSummary}。${parkingSignal}`,
        tone: "warm",
      },
    ],
  };
}
