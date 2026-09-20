# AGENTS.md

给在本仓库工作的 AI 编码助手（Claude Code / Codex / Cursor / Gemini CLI / Copilot 等）。
人类接手请看 `HANDOFF.md`；产品背景见 `docs/VISITORS_PRD.md`。

## 项目一句话

Visitors：面向中国境内城市旅行的**执行型**智能行程规划器。
不做泛旅行推荐，只解决出发前真正会纠结的事：哪些景点要预约、渠道价格是什么、每天怎么走顺、钱花在哪、车停哪。

## 环境与命令

Python 3.11+ 与 Node.js。后端依赖装在 `api/.venv`。

```powershell
# 后端：跑测试（23 个用例，需在 api/ 目录下，pytest.ini 已配 pythonpath 与 testpaths）
cd api
.\.venv\Scripts\python.exe -m pytest -q

# 前端：ESLint + 构建
cd web
npm run lint
npm run build
npm run test     # node --test lib/**/*.test.mjs
```

CI（`.github/workflows/ci.yml`）跑两套：`web` → `npm ci` + `npm run lint`；`api` → `pip install -r requirements.txt` + `pytest -q`。
**提交前本地把这两条都跑通**，不要靠 CI 兜底。

## 架构红线

- **不宣称预约准确率**。小红书解析是 best-effort（`XIAOHONGSHU_PARSER_MODE=best_effort`），
  只读公开可访问内容，**没有标注集评测**。任何界面文案或文档都不得写成「准确率 X%」。
- **路线优化目前是前端演示级**。后端还没有可解释优化器——`lib/` 里的前端优化逻辑是临时实现，
  升级方向就是把它搬到后端。**不要把这层说成"已实现可解释优化器"。**
- **持久化必须可降级**。Supabase 未配置时走本地内存模式，保证 clone 下来不配 key 也能看到完整链路。
  **不要让任何核心链路硬依赖 Supabase 或高德 key。**
- **预约证据是一等对象**。它结构化在 `services/reservation_hint_service.py`，并在**输入阶段**前置预览
  （`POST /plans/evidence-preview`），不是结果页的一句提醒。改这块时保持这个时序。
- **行程必须可编辑**。锁定 / 移除 / 只对弹性路线重优化是可编辑性的核心，不要为了简化把它做成一次性生成。
- **中英文与明暗主题从一开始就是需求**，不是后期补的。新增文案必须同时补中英两份。

## 数据边界

- 只读公开可访问的小红书内容，不绕过登录 / 验证码 / 反爬。
- 高德 key 有个人免费配额，**不要在循环里反复调用**。
- 不要把个人 API key 提交到仓库；`.env` 已 gitignore，使用者从 `.env.example` 复制。

## 代码风格

- 后端：FastAPI + Python，服务层按 `api/app/services/<域>.py` 切分，路由在 `routers/`，契约在 `schemas/`。
- 前端：Next.js App Router，页面在 `web/app/`，组件按域分 `components/{app,intake,map,result}`。
- 提交信息用中文，格式 `类型: 说明`（`feat` / `fix` / `docs` / `chore`）。

## 不要做的事

- 不要编造预约准确率、覆盖率等未评测的数字
- 不要让核心链路依赖外部 key 才能跑通
- 不要把 `reference/` 里的第三方项目代码当成本仓库产出
- 不要提交 `.env`、`.venv/`、`node_modules/`、`web/.next/`
