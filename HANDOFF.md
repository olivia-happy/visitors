# 项目交接文档

## 1. 这是什么项目

**Visitors**：一个面向中国境内城市旅行的执行型智能行程规划器。
它解决的不是"推荐几个景点"，而是把出发前真正会纠结的信息整理成可执行方案：
哪些景点要提前预约、渠道与价格是什么、每天按什么顺序走、大概花多少钱、自驾好不好停车、天气证件有没有漏。

用途：秋招 GitHub 展示 + 面试 Demo（AI 产品经理岗，体现产品判断 + 交互设计 + 全栈工程）。

## 2. 技术栈与架构

- 后端：FastAPI + Python（本地规则规划，可选本地模型，不依赖付费云模型）
- 前端：Next.js（App Router）
- 存储：Supabase；未配置时自动降级为本地内存模式
- 地图 / 天气：高德（AMap Web Service + AMap JS API），免费个人 key
- CI：GitHub Actions（`web` 跑 `npm run lint`，`api` 跑 `pytest -q`）
- 测试：pytest 23 个用例

### 目录结构

```
visitors/
├── api/                    FastAPI planner API
│   ├── app/
│   │   ├── main.py         入口
│   │   ├── core/           配置
│   │   ├── routers/        plans 等路由
│   │   ├── schemas/        请求/响应契约
│   │   ├── services/       planner / amap_service / parking_service / weather_service /
│   │   │                   reservation_hint_service / xiaohongshu_service / plan_store / plan_presentation
│   │   └── tests/          pytest 23 个用例
│   └── pytest.ini          pythonpath = . ；testpaths = app/tests
├── web/                    Next.js 前端
│   ├── app/                / (双入口首页) /plan/new /plan/[planId] /showcase /showcase/share
│   ├── components/         app / intake / map / result
│   └── lib/
├── supabase/               schema、migrations、policies
├── docs/
│   ├── VISITORS_PRD.md         主产品需求文档（中文）
│   ├── VISITORS_PRD.en.md      英文版 PRD
│   ├── portfolio-case.md       面试讲述材料
│   └── archive/                历史草案
├── reference/              本地第三方参考克隆（已 gitignore，不入库）
└── .github/workflows/ci.yml
```

## 3. 当前功能状态（已完成并验证）

### 后端（23 个测试全绿）

- `POST /plans/evidence-preview`：提交前解析预约证据
- `POST /plans` + `GET /plans/{id}`：方案生成闭环
- 规划模块：路线 / 时间轴、预算、清单、节点关系图
- 高德集成：点位渲染、路线与天气相关准备提示
- 预约提示服务：把"建议提前预约"变成结构化的渠道 + 价格 + 证据
- Supabase 持久化，未配置时降级本地内存

### 前端

- 双入口首页：快速规划入口 + 小红书证据优先入口
- 三步移动端输入流程：基础信息 / 旅行风格 / 证据预览
- 结果页：预约风险、执行路线、小时级时间轴、地图、预算、清单、节点关系图、停车、酒店片区
- 行程编辑台：锁定站点、移除站点、只对剩余弹性路线重新优化
- 分享页与展示页；中英文切换；明暗主题切换

## 4. 本次对话总结（如何走到这一步）

### 需求演进

用户目标：秋招 AI 产品经理，统计学研究生，需要展示"产品判断 + 交互设计 + 工程落地"。
最初考虑过做泛旅行助手，最终收窄为**国内旅行执行型规划器**——
因为泛旅行助手的差异化只能靠内容量，而"预约可靠性 + 可执行路线 + 可编辑"是结构性的差异点。

### 关键技术决策

1. **预约证据前置到输入阶段**：不是在结果页写一句"记得预约"，而是在用户提交前就把预约证据摊出来，
   避免"结果页看起来很完整、真正出发才发现约不上"。
2. **结果页做成出行指挥板而不是长攻略**：小时级时间轴 + 路线 + 预算 + 停车 + 清单放同一上下文，面向行动而不是面向阅读。
3. **可编辑而非一次性生成**：锁定必去点、移除不感兴趣点、只对弹性路线重优化——
   把产品从"AI 给一个答案"变成"用户带着约束继续调方案"。
4. **持久化可选**：Supabase 未配置时降级本地内存，保证 clone 下来不配 key 也能看到完整链路。
5. **中英文 + 明暗主题从一开始就做**：这是作品集演示需要，不是后期补的。

### 已实现的重要模块

| 模块 | 说明 |
| --- | --- |
| planner | 行程生成主链路 |
| reservation_hint_service | 预约证据结构化 |
| xiaohongshu_service | 公开链接的最佳努力解析（best-effort） |
| amap_service | 点位、路线、天气 |
| parking_service | 自驾停车建议 |
| plan_store | Supabase 持久化 + 内存降级 |
| plan_presentation | 结果页展示层 |

### 已知风险与待办

1. **路线优化是前端演示级**：当前的"重新优化"在前端完成，不是后端可解释优化器。
   真实距离与预约窗口约束尚未接入——这是 README「下一步」里列的第一件事。
2. **小红书解析是 best-effort**：只读公开可访问内容，不保证覆盖率；
   仓库里**没有宣称预约准确率**，因为没做过标注集评测。
3. **中英文文案未完全对齐**：仍残留少量不一致，属已知项。
4. **演示预设是苏州**：苏州只是录屏与讲解样例，不是产品边界；
   真实使用可输入任意国内城市，但非苏州路径的实测覆盖不如苏州充分。
5. **未做并发与配额治理**：高德 key 有个人免费配额，未做限流与重试队列。

## 5. 新电脑安装环境（完整步骤）

> 只需 Python 3.11+ 与 Node.js。

### 5.1 后端

```powershell
cd D:\path\to\visitors\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env    # 按需填 Supabase / 高德 key
uvicorn app.main:app --reload
```

### 5.2 前端

```powershell
cd D:\path\to\visitors\web
npm install
Copy-Item .env.example .env.local   # 按需填 API 地址 / Supabase / 高德 key
npm run dev
```

### 5.3 常用页面

- `http://localhost:3000/`
- `http://localhost:3000/plan/new?entry=quick`
- `http://localhost:3000/plan/new?entry=xiaohongshu`
- `http://localhost:3000/showcase`
- `http://localhost:3000/showcase/share`

> 只想看界面可以先开 `/showcase`，不需要接完所有外部服务。

### 5.4 跑测试

```powershell
cd D:\path\to\visitors\api
.\.venv\Scripts\python.exe -m pytest -q
```

## 6. 常见问题

- **没配 key 也能跑吗**：能。持久化降级本地内存，`/showcase` 不需要外部服务。
- **高德点位不显示**：检查 `NEXT_PUBLIC_AMAP_JS_KEY` 与安全码是否都填了（JS API 需要两个）。
- **不要提交个人 key**：`.env` 已 gitignore，请从 `.env.example` 复制后再填。
- **小红书解析失败**：属预期，best-effort 模式只读公开内容，失败时不影响其他规划模块。

## 7. 面试叙事要点

1. **用户与痛点**：周末/短途出行者出发前真正焦虑的不是"去哪玩"，而是"哪个要预约、怎么走顺、钱够不够、车停哪"。
2. **为什么不做泛旅行助手**：泛助手的护城河是内容量，单人项目拼不过；收窄到"预约可靠性 + 可执行路线"才有结构性差异。
3. **预约风险是一等公民**：把它做成结构化对象并前置到输入阶段，而不是结果页的一句提醒。
4. **交互上的关键选择**：把一次性生成改成可预览、可编辑、可分享——用户能带着约束继续调，而不是接受一个答案。
5. **工程落地**：Next.js + FastAPI + Supabase + 高德，前端/后端/持久化/地图/预算/证据解析形成闭环；CI 跑前后端两套检查。
6. **诚实边界**：路线优化目前是前端演示级、预约解析是 best-effort，仓库不宣称预约准确率——这些都在 README 的「下一步」里，不藏起来。
