# Visitors 移动端双入口与执行型结果页实施计划

> **给 Claude：** 必须使用 `superpowers:executing-plans` 子技能，按任务逐项执行本计划。

**目标：** 在当前 `Visitors` 代码库上，把原型化输入页升级为移动端双入口三步向导，并把结果页升级为以“预约风险 + 可执行路线”为首屏核心、支持自驾停车与酒店片区建议的单主方案产品形态。

**架构方案：** 保持现有 `POST /plans` 与 `GET /plans/{id}` 双接口不变，通过扩展 `PlanCreateRequest`、`PlanRecord` 和 `plan_store` 完成新字段持久化；前端在现有 `page.tsx`、`plan-intake-form.tsx`、`plan-result-shell.tsx` 基础上拆出更细的向导与结果模块；停车、自驾和结果首屏逻辑优先采用规则化生成，避免在这一轮引入新的重型后端服务。

**技术栈：** Next.js App Router、TypeScript、Tailwind CSS、FastAPI、Pydantic、Pytest、Supabase、AMap JS API、AMap Web Service API、Git

---

## 前置上下文

当前仓库已经具备这些基础：

- `web/app/page.tsx`：首页
- `web/app/plan/new/page.tsx`：输入页
- `web/app/plan/[planId]/page.tsx`：结果页
- `web/components/intake/plan-intake-form.tsx`：当前单页表单
- `web/components/result/plan-result-shell.tsx`：当前结果壳
- `api/app/schemas/plan.py`：请求/结果 schema
- `api/app/services/planner.py`：结果生成
- `api/app/services/plan_store.py`：内存/Supabase 双存储
- `api/app/services/reservation_hint_service.py`：小红书预约证据提取

实施时必须遵守：

- 使用 TDD
- 不回退已有能力
- 预约提醒仍然只能来自小红书证据
- 自驾停车信息只在 `parking_required = true` 时出现
- 每个任务结束都要运行对应验证命令再继续

## 任务拆解

### 任务 1：扩展后端请求与结果契约

**涉及文件：**
- 修改：`api/app/schemas/plan.py`
- 修改：`api/app/services/plan_store.py`
- 修改：`api/app/services/planner.py`
- 修改：`api/app/routers/plans.py`
- 新建：`supabase/migrations/004_add_mobile_dual_entry_fields.sql`
- 测试：`api/app/tests/test_plans.py`
- 测试：`api/app/tests/test_plan_store.py`
- 测试：`api/app/tests/test_planner_service.py`

**步骤 1：先写一个失败的请求契约测试**

在 `api/app/tests/test_plans.py` 增加至少两个测试：

```python
def test_create_plan_accepts_mobile_dual_entry_fields(client):
    response = client.post(
        "/plans",
        json={
            "city": "Suzhou",
            "days": 2,
            "transport_preferences": ["drive"],
            "entry_mode": "quick",
            "travel_mode": "photo",
            "preference_tags": ["food", "photo_ready"],
            "parking_required": True,
            "parking_sort": "distance",
            "max_walk_from_parking_minutes": 30,
            "output_language": "zh-CN",
        },
    )
    assert response.status_code == 201
```

```python
def test_create_plan_rejects_invalid_parking_sort(client):
    response = client.post(
        "/plans",
        json={
            "city": "Suzhou",
            "days": 2,
            "entry_mode": "quick",
            "travel_mode": "photo",
            "parking_required": True,
            "parking_sort": "random",
            "output_language": "zh-CN",
        },
    )
    assert response.status_code == 422
```

**步骤 2：先写一个失败的持久化测试**

在 `api/app/tests/test_plan_store.py` 增加断言：

- `entry_mode`
- `travel_mode`
- `preference_tags`
- `parking_required`
- `parking_sort`
- `max_walk_from_parking_minutes`
- `execution_summary`
- `reservation_risks`
- `parking_guides`
- `hotel_area_recommendations`

示例：

```python
assert fetched.entry_mode == "quick"
assert fetched.parking_required is True
assert fetched.execution_summary is not None
```

**步骤 3：运行测试，确认先失败**

运行：

```bash
cd api
.venv\Scripts\python.exe -m pytest -q app/tests/test_plans.py app/tests/test_plan_store.py app/tests/test_planner_service.py
```

预期：**失败（FAIL）**，原因是 schema 和 store 还不认识这些字段。

**步骤 4：编写最小实现**

在 `api/app/schemas/plan.py` 中补充：

- `entry_mode: Literal["quick", "xiaohongshu"] = "quick"`
- `travel_mode: Literal["photo", "citywalk", "nature", "garden_culture"] | None = None`
- `preference_tags: list[str] = Field(default_factory=list)`
- `parking_required: bool = False`
- `parking_sort: Literal["distance", "price"] | None = None`
- `max_walk_from_parking_minutes: int | None = Field(default=None, ge=1, le=60)`

同时新增输出模型：

```python
class ExecutionSummary(BaseModel):
    headline: str
    pace: str
    transport_strategy: str
    best_for: list[str] = Field(default_factory=list)
```

```python
class ReservationRisk(BaseModel):
    poi_name: str
    severity: str
    reservation_channel: str | None = None
    price_note: str | None = None
    evidence_excerpt: str
```

```python
class ParkingGuide(BaseModel):
    poi_name: str
    parking_difficulty: str
    recommended_lot_name: str
    walking_minutes: int
    price_note: str | None = None
    sort_mode: str
```

```python
class HotelAreaRecommendation(BaseModel):
    area_name: str
    parking_convenience: str
    parking_price_note: str | None = None
    access_note: str
    suitable_modes: list[str] = Field(default_factory=list)
    budget_band: str | None = None
```

在 `PlanRecord` 中增加：

- `execution_summary`
- `reservation_risks`
- `parking_guides`
- `hotel_area_recommendations`

在 `api/app/services/plan_store.py` 中：

- `build_plan_record(...)` 透传新字段
- `_serialize_plan_row(...)` 把新 JSON 结构写入 `plans` 表
- `get(...)` 时把 JSON 结构恢复成 Pydantic 模型

在 `supabase/migrations/004_add_mobile_dual_entry_fields.sql` 中新增 `jsonb` / 标量字段。

**步骤 5：再次运行测试，确认通过**

运行：

```bash
cd api
.venv\Scripts\python.exe -m pytest -q app/tests/test_plans.py app/tests/test_plan_store.py app/tests/test_planner_service.py
```

预期：**通过（PASS）**

**步骤 6：提交变更**

```bash
git add api/app/schemas/plan.py api/app/services/plan_store.py api/app/services/planner.py api/app/routers/plans.py api/app/tests/test_plans.py api/app/tests/test_plan_store.py api/app/tests/test_planner_service.py supabase/migrations/004_add_mobile_dual_entry_fields.sql
git commit -m "feat: extend plan contract for mobile dual entry"
```

### 任务 2：补齐执行摘要与预约风险视图模型

**涉及文件：**
- 修改：`api/app/services/planner.py`
- 新建：`api/app/services/plan_presentation.py`
- 测试：`api/app/tests/test_planner_service.py`

**步骤 1：先写一个失败的 planner 测试**

在 `api/app/tests/test_planner_service.py` 中新增：

```python
def test_build_plan_output_generates_execution_summary_and_reservation_risks():
    payload = PlanCreateRequest(
        city="Suzhou",
        days=2,
        travel_mode="photo",
        preference_tags=["night_view", "photo_ready"],
        output_language="zh-CN",
    )
    hints = [
        ReservationHint(
            poi_name="苏州博物馆",
            reminder_text="需要提前预约",
            reservation_channel="公众号",
            price_note="免费",
            source_url="https://www.xiaohongshu.com/example",
            evidence_excerpt="虽然免费但是要提前预约。",
        )
    ]

    output = build_plan_output(payload=payload, reservation_hints=hints)

    assert output.execution_summary is not None
    assert output.execution_summary.headline
    assert output.reservation_risks[0].poi_name == "苏州博物馆"
```

**步骤 2：运行测试，确认先失败**

运行：

```bash
cd api
.venv\Scripts\python.exe -m pytest -q app/tests/test_planner_service.py::test_build_plan_output_generates_execution_summary_and_reservation_risks
```

预期：**失败（FAIL）**

**步骤 3：实现最小生成逻辑**

把展示层规则从 `planner.py` 里拆到新文件 `api/app/services/plan_presentation.py`：

- `build_execution_summary(...)`
- `build_reservation_risks(...)`

规则要求：

- `reservation_risks` 只使用现有 `ReservationHint` 证据，不额外猜测
- `execution_summary` 根据：
  - `travel_mode`
  - `transport_preferences`
  - `timeline`
  - `weather_summary`
  生成一段可执行摘要

示例伪代码：

```python
def build_execution_summary(payload, timeline, weather_summary):
    return ExecutionSummary(
        headline="这趟更适合上午先完成预约景点，下午再转入拍照和慢逛。",
        pace="balanced",
        transport_strategy="地铁 + 短距离步行",
        best_for=["出片打卡", "周末 2 天"]
    )
```

**步骤 4：再次运行测试**

运行：

```bash
cd api
.venv\Scripts\python.exe -m pytest -q app/tests/test_planner_service.py
```

预期：**通过（PASS）**

**步骤 5：提交变更**

```bash
git add api/app/services/planner.py api/app/services/plan_presentation.py api/app/tests/test_planner_service.py
git commit -m "feat: add execution summary and reservation risk views"
```

### 任务 3：补齐自驾停车与酒店片区建议

**涉及文件：**
- 新建：`api/app/services/parking_service.py`
- 修改：`api/app/services/planner.py`
- 修改：`api/app/services/plan_store.py`
- 测试：`api/app/tests/test_parking_service.py`
- 测试：`api/app/tests/test_planner_service.py`

**步骤 1：先写一个失败的停车服务测试**

在 `api/app/tests/test_parking_service.py` 中新增：

```python
def test_build_parking_guides_respects_distance_sort():
    guides = build_parking_guides(
        city="Suzhou",
        poi_names=["拙政园"],
        parking_sort="distance",
        max_walk_minutes=30,
    )
    assert guides[0].sort_mode == "distance"
```

```python
def test_build_parking_guides_returns_empty_for_non_drive_mode():
    guides = build_parking_guides_for_plan(
        parking_required=False,
        city="Suzhou",
        poi_names=["拙政园"],
    )
    assert guides == []
```

**步骤 2：运行测试，确认先失败**

运行：

```bash
cd api
.venv\Scripts\python.exe -m pytest -q app/tests/test_parking_service.py
```

预期：**失败（FAIL）**

**步骤 3：实现最小规则化停车服务**

在 `api/app/services/parking_service.py` 中先做 deterministic V1：

- 不接第三方停车 API
- 使用按城市维护的小型模板
- 每个景点返回 1 个主推荐停车点
- 排序只支持 `distance` 与 `price`

示例骨架：

```python
CITY_PARKING_TEMPLATES = {
    "Suzhou": {
        "拙政园": [
            {
                "lot_name": "苏州博物馆北停车场",
                "walking_minutes": 8,
                "price_note": "约 8 元/小时",
                "parking_difficulty": "一般",
            }
        ]
    }
}
```

同时实现：

- `build_parking_guides(...)`
- `build_hotel_area_recommendations(...)`

在 `planner.py` 中只在 `payload.parking_required is True` 时调用它们。

**步骤 4：补一个失败的 planner 条件测试**

在 `api/app/tests/test_planner_service.py` 中增加：

```python
assert output.parking_guides == []
assert output.hotel_area_recommendations == []
```

针对非自驾输入；再补一个自驾输入断言非空。

**步骤 5：再次运行测试**

运行：

```bash
cd api
.venv\Scripts\python.exe -m pytest -q app/tests/test_parking_service.py app/tests/test_planner_service.py
```

预期：**通过（PASS）**

**步骤 6：提交变更**

```bash
git add api/app/services/parking_service.py api/app/services/planner.py api/app/services/plan_store.py api/app/tests/test_parking_service.py api/app/tests/test_planner_service.py
git commit -m "feat: add self-drive parking and hotel area suggestions"
```

### 任务 4：把输入页重构成双入口三步向导

**涉及文件：**
- 修改：`web/app/page.tsx`
- 修改：`web/app/plan/new/page.tsx`
- 修改：`web/components/intake/plan-intake-form.tsx`
- 新建：`web/components/intake/plan-entry-hero.tsx`
- 新建：`web/components/intake/plan-wizard.tsx`
- 新建：`web/components/intake/step-basics.tsx`
- 新建：`web/components/intake/step-style.tsx`
- 新建：`web/components/intake/step-evidence.tsx`
- 新建：`web/lib/intake-helpers.js`
- 新建：`web/lib/intake-helpers.test.mjs`
- 修改：`web/lib/schemas.ts`
- 修改：`web/lib/api.ts`

**步骤 1：先写一个失败的前端 helper 测试**

在 `web/lib/intake-helpers.test.mjs` 中新增：

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlanPayload,
  shouldShowParkingFields,
  getInitialWizardState,
} from "./intake-helpers.js";

test("shouldShowParkingFields returns true for drive mode", () => {
  assert.equal(shouldShowParkingFields(["drive"]), true);
});

test("getInitialWizardState highlights evidence step for xiaohongshu entry", () => {
  const state = getInitialWizardState({ entryMode: "xiaohongshu" });
  assert.equal(state.entryMode, "xiaohongshu");
});
```

**步骤 2：运行测试，确认先失败**

运行：

```bash
cd web
npm test
```

预期：**失败（FAIL）**，因为 helper 文件还不存在。

**步骤 3：实现最小 helper**

在 `web/lib/intake-helpers.js` 中实现：

- `shouldShowParkingFields(transportPreferences)`
- `getInitialWizardState({ entryMode })`
- `buildPlanPayload(formState)`

要求：

- `entry=quick` 与 `entry=xiaohongshu` 都能转成 `PlanInput`
- 自驾时自动补：
  - `parking_required: true`
  - `parking_sort`
  - `max_walk_from_parking_minutes: 30`

**步骤 4：重构输入页组件**

把当前 `plan-intake-form.tsx` 拆成：

- `PlanWizard`
- `StepBasics`
- `StepStyle`
- `StepEvidence`

同时修改：

- `web/app/page.tsx`：首页双入口
- `web/app/plan/new/page.tsx`：读取 query 参数并渲染向导

UI 要求：

- 手机端单列优先
- 顶部固定三步进度
- 底部固定主按钮
- 单屏只出现当前步骤内容

**步骤 5：再次运行验证**

运行：

```bash
cd web
npm test
npm run lint
```

预期：**全部通过**

**步骤 6：提交变更**

```bash
git add web/app/page.tsx web/app/plan/new/page.tsx web/components/intake web/lib/intake-helpers.js web/lib/intake-helpers.test.mjs web/lib/schemas.ts web/lib/api.ts
git commit -m "feat: add dual-entry mobile wizard intake"
```

### 任务 5：重构结果页为执行型首屏

**涉及文件：**
- 修改：`web/components/result/plan-result-shell.tsx`
- 新建：`web/components/result/plan-hero-summary.tsx`
- 新建：`web/components/result/reservation-risk-panel.tsx`
- 新建：`web/components/result/execution-route-panel.tsx`
- 新建：`web/components/result/parking-guide-panel.tsx`
- 新建：`web/components/result/hotel-area-panel.tsx`
- 新建：`web/lib/result-helpers.js`
- 新建：`web/lib/result-helpers.test.mjs`
- 修改：`web/lib/mock-plan.ts`
- 修改：`web/app/showcase/page.tsx`

**步骤 1：先写一个失败的结果 helper 测试**

在 `web/lib/result-helpers.test.mjs` 中新增：

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import {
  shouldRenderParkingPanels,
  buildPrimaryResultSections,
} from "./result-helpers.js";

test("shouldRenderParkingPanels only returns true for parking-required plans", () => {
  assert.equal(shouldRenderParkingPanels({ parking_required: true }), true);
  assert.equal(shouldRenderParkingPanels({ parking_required: false }), false);
});
```

**步骤 2：运行测试，确认先失败**

运行：

```bash
cd web
npm test
```

预期：**失败（FAIL）**

**步骤 3：实现最小 helper 与展示组件**

在 `web/lib/result-helpers.js` 中实现：

- `shouldRenderParkingPanels(plan)`
- `buildPrimaryResultSections(plan)`

在 `plan-result-shell.tsx` 中把首屏调整为：

1. `PlanHeroSummary`
2. `ReservationRiskPanel`
3. `ExecutionRoutePanel`

并把：

- 地图
- 时间轴
- 预算
- 清单
- 图关系

下移到中段。

仅当 `plan.parking_required` 为真时渲染：

- `ParkingGuidePanel`
- `HotelAreaPanel`

**步骤 4：补齐 showcase 数据**

在 `web/lib/mock-plan.ts` 中新增：

- `entry_mode`
- `travel_mode`
- `preference_tags`
- `parking_required`
- `parking_sort`
- `max_walk_from_parking_minutes`
- `execution_summary`
- `reservation_risks`
- `parking_guides`
- `hotel_area_recommendations`

让 `/showcase` 能直接验证新的结果层级。

**步骤 5：再次运行验证**

运行：

```bash
cd web
npm test
npm run lint
npm run build
```

预期：**全部通过**

**步骤 6：提交变更**

```bash
git add web/components/result web/lib/result-helpers.js web/lib/result-helpers.test.mjs web/lib/mock-plan.ts web/app/showcase/page.tsx
git commit -m "feat: redesign result page for execution-first mobile flow"
```

### 任务 6：全量回归与发布前核查

**涉及文件：**
- 修改：`README.md`
- 可选修改：`web/.env.example`
- 可选修改：`api/.env.example`

**步骤 1：运行后端全量测试**

运行：

```bash
cd api
.venv\Scripts\python.exe -m pytest -q
```

预期：**全部通过**

**步骤 2：运行前端全量验证**

运行：

```bash
cd web
npm test
npm run lint
npm run build
```

预期：**全部通过**

**步骤 3：手动做三组移动端回归**

至少验证：

1. `quick` 入口 + 地铁出行
2. `xiaohongshu` 入口 + 苏州博物馆预约场景
3. `drive` 场景 + 停车排序切换

手动检查项：

- 首页双入口跳转是否正确
- 三步向导是否在手机宽度下清晰
- 自驾时停车字段是否出现
- 非自驾时停车模块是否完全隐藏
- 结果页首屏是否先看到 `预约风险 + 执行路线`

**步骤 4：更新 README 的产品概览**

在 `README.md` 中补充：

- 双入口说明
- 三步向导说明
- 自驾停车能力说明
- `/showcase` 预览说明

**步骤 5：提交收尾变更**

```bash
git add README.md web/.env.example api/.env.example
git commit -m "docs: update product overview for mobile dual entry flow"
```

## 验证方式

在整个计划执行过程中，必须遵守：

- 每新增一个后端字段，先有失败测试
- 每新增一个前端状态规则，先抽成纯函数并写 node 测试
- 每个任务完成后运行对应局部测试
- 每完成一个大任务后再跑全量验证

最终完成判定标准：

- `POST /plans` 与 `GET /plans/{id}` 已包含新字段
- 首页已是双入口结构
- `/plan/new` 已是三步向导
- `/plan/[planId]` 首屏已以 `预约风险 + 执行路线` 为核心
- 自驾时能看到停车与酒店片区建议
- 非自驾时不出现停车模块
- `api` 与 `web` 全量验证通过

## 风险与注意事项

- 本轮不要引入新的重型 UI 库；优先复用现有 Tailwind 结构
- 本轮不要新增新的业务接口；优先扩展现有 `plans` 接口
- 停车建议先做规则化 V1，不要在这一轮引入不稳定外部停车数据源
- 预约提醒的证据边界不能被“结果页更好看”破坏
- 如果 `planner.py` 继续膨胀，要主动把展示规则拆出到 `plan_presentation.py`、`parking_service.py`

## 执行建议顺序

建议严格按下面顺序推进，不要并行乱改：

1. 任务 1：扩展后端请求与结果契约
2. 任务 2：补齐执行摘要与预约风险视图模型
3. 任务 3：补齐自驾停车与酒店片区建议
4. 任务 4：把输入页重构成双入口三步向导
5. 任务 5：重构结果页为执行型首屏
6. 任务 6：全量回归与发布前核查
