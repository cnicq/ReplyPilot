# ReplyPilot

> ReplyPilot is a local-first AI reply assistant for creators that generates persona-aware social media replies based on account profiles, writing style, and reply history.

**最终目标：让 AI 学会以这个账号的身份回复。**

本地优先的小红书评论回复助手：Chrome 插件 + FastAPI + PostgreSQL + MiMo（默认）/ OpenAI 兼容 API。

AI assists. You decide. 不自动发帖。

## 核心机制

- **默认 Profile（必须）** — 用户设一次默认账号，每次生成自动使用，无需重复选择
- **Account Profile** — 账号定位、人设、语气、禁忌词等
- **Writing DNA** — 「我怎么说话」，最重要的写作风格字段
- **Reply History** — 已复制回复作为 few-shot 记忆，越用越像本人

## 架构

```
小红书网页 → Chrome Extension → FastAPI (localhost:7800) → PostgreSQL
                                              ↓
                                    MiMo（默认）/ OpenAI 兼容 API
```

## 快速启动

```bash
# 方式一：一键脚本（PostgreSQL + FastAPI + 扩展构建）
chmod +x scripts/dev.sh
npm run dev:all

# 方式二：分步启动
make dev-db          # PostgreSQL
make dev-api         # FastAPI → http://localhost:7800/docs
npm run dev          # 扩展 → 加载 dist/ 到 chrome://extensions
```

### 手动启动

```bash
docker compose up -d
```

### 2. FastAPI 后端

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入 AI_API_KEY

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 7800
```

API 文档：http://localhost:7800/docs

### 3. Chrome 扩展

```bash
npm install
npm run dev
```

在 `chrome://extensions` 开启开发者模式，加载 `dist` 目录。

## API 端点

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/profiles` | 获取全部 Profile |
| POST | `/profiles` | 创建 Profile |
| PUT | `/profiles/{id}` | 更新 Profile（含设为默认 `is_default: true`） |
| POST | `/profiles/seed-example` | 导入示例 Profile（含 Writing DNA） |
| DELETE | `/profiles/{id}` | 删除 Profile |
| POST | `/replies/generate` | 生成 3 条回复 |
| GET | `/reply-history` | 查询回复历史 |
| POST | `/reply-history` | 保存回复历史 |
| GET | `/settings` | 获取 AI 设置 |
| PUT | `/settings` | 更新 AI Provider / API Key / 模型 |
| GET | `/settings/providers` | 获取支持的 Provider 列表 |

## AI Provider

| Provider | 默认 Base URL | 默认模型 | 备注 |
|----------|---------------|----------|------|
| **MiMo** | `https://api.xiaomimimo.com/v1` | `mimo-v2.5-pro` | **v1 默认** |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | |
| Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | |
| Custom | 自定义 | 自定义 | |

## 数据库表

- `profiles` — 社媒账号人设配置
- `reply_history` — 回复历史（few-shot 记忆）
- `settings` — 全局设置（AI 配置，内部使用）

## 使用流程

1. 扩展弹窗 → 创建 Profile → 设为默认
2. 设置页 → 选择 Provider 并配置 API Key
3. 打开小红书 → 选中评论 → 点击 ReplyPilot → 生成并复制

## 环境变量 (`backend/.env`)

```env
DATABASE_URL=postgresql://replypilot:replypilot@localhost:5433/replypilot
AI_PROVIDER=mimo
# openai | deepseek | mimo | qwen | custom
AI_API_KEY=your-key
AI_BASE_URL=https://api.xiaomimimo.com/v1
AI_MODEL=mimo-v2.5-pro
MAX_HISTORY_EXAMPLES=15
```
