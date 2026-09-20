# CLAUDE.md

本仓库的 Claude Code 项目指令。通用内容在 `AGENTS.md`（跨工具标准），本文件补充 Claude Code 特有的用法。

@AGENTS.md

## 在这个仓库里怎么干活

- **改后端先跑测试**：`cd api; .\.venv\Scripts\python.exe -m pytest -q`（23 个用例）。
  只改前端可以只跑 `cd web; npm run lint`。
- **改完前端顺手 build 一次**：`npm run build`。Next.js 的类型错误只在 build 时暴露。
- **新增任何用户可见文案，必须同时补中英两份**——这是本项目的既有约定，不是可选项。
- **不要给后端引入无标注集的评测结论**。解析类逻辑（小红书、预约）目前是 best-effort。

## 红线（改代码前先确认没踩）

- 不宣称预约准确率（best-effort 解析，无标注集）
- 不要把前端演示级的路线优化说成"可解释优化器"
- Supabase / 高德都是**可选依赖**，核心链路必须能在无 key 时降级跑通
- 预约证据必须在输入阶段前置（`POST /plans/evidence-preview`），不能只在结果页提
- 行程编辑台（锁定 / 移除 / 重优化弹性路线）是核心交互，不要简化掉

## 常用文件定位

| 要找什么 | 去这里 |
| --- | --- |
| 后端入口与路由 | `api/app/main.py`、`api/app/routers/` |
| 行程生成主链路 | `api/app/services/planner.py` |
| 预约证据结构化 | `api/app/services/reservation_hint_service.py` |
| 小红书解析（best-effort） | `api/app/services/xiaohongshu_service.py` |
| 高德集成（点位/路线/天气） | `api/app/services/amap_service.py`、`weather_service.py` |
| 停车建议 | `api/app/services/parking_service.py` |
| 持久化与降级 | `api/app/services/plan_store.py` |
| 结果页展示层 | `api/app/services/plan_presentation.py` |
| 前端页面 | `web/app/`（`/`、`/plan/new`、`/plan/[planId]`、`/showcase`） |
| 前端组件 | `web/components/{app,intake,map,result}/` |
| 数据库 schema | `supabase/` |
| 产品文档 | `docs/VISITORS_PRD.md`、`docs/portfolio-case.md` |
| 人类接手 | `HANDOFF.md` |

## 注意

`reference/` 下是 8 个第三方参考项目（已 gitignore，不入库），**不要把它们当成本仓库产出，也不要改它们**。

## 提交

中文提交信息，格式 `类型: 说明`。
不要提交 `.env`、`api/.venv/`、`web/node_modules/`、`web/.next/`。
