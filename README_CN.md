# Puppet Resume - 后端服务
基于 Node.js、Puppeteer 和 Gemini AI 的专业简历智能重塑与 PDF 生成后端。
[English Version](./README.md)

## 核心能力：简历“自动裁剪”

本项目不仅仅是 PDF 生成器。其核心功能是利用 AI 实现**简历自动裁剪**：根据目标職位的职位描述（JD），自动对用户的原始简历进行内容筛选、重点突出和语言优化，确保每一份生成的简历都能精准契合岗位需求。

## 功能特性

- ✂️ **AI 智能简历裁剪**: 基于职位描述（JD）深度分析，自动重写工作经历和技能描述，实现“一岗一策”。
- 📑 **高质量 PDF 生成**: 使用 Puppeteer 驱动，基于动态 HTML 模板生成像素级完美的专业简历。
- 🤖 **Gemini 引擎动力**: 深度集成 Google Gemini 大模型，提供逻辑清晰、语调自然的简历内容优化。
- 🌍 **全球化支持**: 完美支持中英文简历生成，自动处理日期格式、专业术语等语言差异。
- 💳 **会员与支付系统**: 完善的微信支付集成，支持会员权限控制，为商业化运营提供基础。

## 项目结构

- `src/server.ts`: Express 应用入口。
- `src/resumeAIService.ts`: 核心 AI 裁剪逻辑。
- `src/resumeGenerator.ts`: 基于 Puppeteer 的 PDF 生成核心逻辑。
- `src/geminiService.ts`: Gemini AI 接口对接。
- `src/db.ts`: MongoDB 数据持久化。
- `src/interfaces/`: 业务接口路由。

## 许可证

ISC
