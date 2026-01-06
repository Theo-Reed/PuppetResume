# Resume PDF Generator

一个使用 TypeScript 和 Puppeteer 生成简历 PDF 的 Node.js 项目。

## 功能特性

- 📄 基于 HTML 模板生成美观的简历 PDF
- 🎨 现代化的简历样式设计
- 📝 支持完整的简历信息（个人信息、教育背景、工作经历等）
- 🔧 TypeScript 类型支持
- 🚀 易于集成和使用

## 安装依赖

```bash
npm install
```

## 使用方法

### 1. 基本使用

```typescript
import { ResumeGenerator, ResumeData } from './src';

const generator = new ResumeGenerator();

const resumeData: ResumeData = {
  name: '张三',
  position: '前端开发工程师',
  contact: {
    phone: '13800138000',
    email: 'zhangsan@example.com',
    wechat: 'zhangsan123',
  },
  yearsOfExperience: 3,
  education: [
    {
      school: 'XX大学',
      degree: '计算机科学与技术 本科',
      graduationDate: '2020-2024',
    },
  ],
  personalIntroduction: '热爱前端开发，具备丰富的项目经验...',
  workExperience: [
    {
      company: 'XX科技有限公司',
      position: '前端开发工程师',
      startDate: '2021.7',
      endDate: '至今',
      responsibilities: [
        '负责公司前端项目的开发和维护',
        '参与产品需求讨论和技术方案设计',
      ],
    },
  ],
};

// 生成 PDF 文件
await generator.generatePDFToFile(resumeData, './resume.pdf');

// 或生成 Buffer
const pdfBuffer = await generator.generatePDFToBuffer(resumeData);
```

### 2. 运行示例

```bash
# 开发模式运行
npm run dev

# 或先编译再运行
npm run build
npm start
```

## 数据结构

### ResumeData

```typescript
interface ResumeData {
  name: string;                    // 姓名
  position: string;                 // 岗位
  contact: ContactInfo;             // 联系方式
  yearsOfExperience: number;        // 几年经验
  education: Education[];           // 教育背景（可多个）
  personalIntroduction: string;     // 个人介绍
  workExperience: WorkExperience[]; // 工作经历
}
```

### ContactInfo

```typescript
interface ContactInfo {
  phone?: string;   // 电话（可选）
  email?: string;   // 邮箱（可选）
  wechat?: string;  // 微信（可选）
}
```

### Education

```typescript
interface Education {
  school: string;           // 学校名称
  degree?: string;          // 学位/专业（可选）
  graduationDate: string;  // 毕业时间（格式：YYYY-MM 或 YYYY）
  description?: string;     // 其他描述/成就（可选）
}
```

### WorkExperience

```typescript
interface WorkExperience {
  company: string;              // 公司名称
  position: string;             // 职位
  startDate: string;            // 开始时间（格式：YYYY-MM）
  endDate: string;              // 结束时间（格式：YYYY-MM 或 "至今"）
  responsibilities?: string[]; // 工作职责和成就（可选，数组）
}
```

## 项目结构

```
puppet-resume/
├── src/
│   ├── types.ts              # 类型定义
│   ├── template.html         # HTML 模板
│   ├── resumeGenerator.ts    # PDF 生成器核心逻辑
│   └── index.ts              # 入口文件和示例
├── dist/                     # 编译后的 JavaScript 文件
├── tsconfig.json             # TypeScript 配置
├── package.json
└── README.md
```

## 开发

```bash
# 编译 TypeScript
npm run build

# 开发模式运行（使用 ts-node）
npm run dev
```

## 注意事项

- 确保已安装 Chrome/Chromium（Puppeteer 需要）
- 首次运行时会自动下载 Chromium
- PDF 生成需要一些时间，请耐心等待

## License

ISC

