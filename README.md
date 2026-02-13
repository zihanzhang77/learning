# vibecoding App

面向有学习记录习惯的年轻人（学生、考研党、日记党、职场新人）的学习记录工具，支持每日进展记录、致未来的信、AI 鼓励与学习目标/路径规划。

> **注意**：本项目核心功能定义见 [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md)，请严格遵循该文档进行开发。

## 功能特性

- 📔 **每日进展记录 (日记)**: 按「日期 + 标题 + 正文」记录当日进展，支持历史查看。
- 📮 **致未来的信**: 写给 3 年 / 5 年 / 10 年后的自己。
- 🤖 **AI 智能鼓励**: 基于近 3 日记录，生成个性化鼓励内容。
- 🎯 **AI 目标规划**: 基于记录生成清晰的学习目标与路径。
- 👤 **个人中心**: 管理个人资料与数据。

## 技术栈

### 前端
- React 19 + TypeScript
- Vite 6
- React Router 7
- Tailwind CSS

### 后端
- Node.js + Express
- Supabase (PostgreSQL)
- DeepSeek API (AI)

## 快速开始

请参考 [SETUP.md](./SETUP.md) 进行环境配置和启动。

### 核心交互流程
打开 App → 登录 → 写日记（按日期 + 标题 + 正文框架）并保存 → AI 大模型分析内容生成鼓励 → 退出 App。
