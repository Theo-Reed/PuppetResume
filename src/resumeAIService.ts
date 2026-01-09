import { GeminiService } from "./geminiService";
import { GenerateFromFrontendRequest, ResumeData, mapFrontendRequestToResumeData } from "./types";

export class ResumeAIService {
  private gemini: GeminiService;

  constructor() {
    this.gemini = new GeminiService();
  }

  /**
   * 核心方法：利用 AI 增强简历内容
   */
  async enhance(payload: GenerateFromFrontendRequest): Promise<ResumeData> {
    const baseData = mapFrontendRequestToResumeData(payload);
    const { resume_profile: profile, job_data: job, language } = payload;
    const isEnglish = language === 'english';

    // 1. 计算最早可工作时间 (出生年 + 19 岁)
    const birthYear = parseInt(profile.birthday.split('-')[0]);
    const earliestWorkYear = birthYear + 19;
    const earliestWorkDate = `${earliestWorkYear}-07`;

    // 2. 提取岗位要求的年限 (例如 "5-10年" -> 5)
    const requiredYearsMatch = job.experience.match(/(\d+)/);
    const requiredYears = requiredYearsMatch ? parseInt(requiredYearsMatch[1]) : 0;

    // 3. 构造 Prompt
    const prompt = `
你是一位顶级的简历包装专家和资深猎头。你的核心原则是：【一切以目标岗位为准】。

### 🚨 核心指令 (TOP PRIORITY - 必须严格执行)
1. **身份必须完全一致**：你生成的简历【职位名称】(\`position\`) 必须且只能是：“${baseData.position}”。严禁自作主张修改为“商业化运营”、“产品经理”等。
2. **推翻重写原则**：用户的原始背景（如程序员、运营等）如果与“${baseData.position}”不符，你必须【彻底抹除】原始职位的技术/运营痕迹。生成的简历必须让 HR 认为该用户一直就在从事“${baseData.position}”相关工作。
3. **经历强行适配**：
   - 保持公司（如 ${profile.workExperiences.map(e => e.company).join('、')}）和时间段不变。
   - 职位名重塑：将所有职位名改为与“${baseData.position}”强相关的称呼。
   - 职责描述重塑：必须使用行业专业术语。严禁提到与目标岗位无关的原始技术栈。
   - **职位命名规范 (NATURAL HUMAN TITLES)**：请使用真实职场中人类会使用的自然职位名（如：招聘主管、教研管理、审核组长）。

### 1. 目标岗位信息
- 岗位名称: ${baseData.position}
- 岗位描述: ${job.description_chinese}
- 经验要求: ${job.experience}

### 2. 用户基础背景 (仅供参考)
- 姓名: ${profile.name}
- 身份: ${profile.identity}
- AI 指令: ${profile.aiMessage}
- 最早可开始工作时间限制: ${earliestWorkDate}

### 3. 当前工作经历 (需根据业务方向进行【完全重塑】)
${profile.workExperiences.map((exp, i) => `
经历 ${i + 1}:
- 公司: ${exp.company}
- 原始职位: ${exp.jobTitle} (忽略此职位的技术属性，根据业务方向重写)
- 业务方向: ${exp.businessDirection} (👈 核心背景依据)
- 时间: ${exp.startDate} 至 ${exp.endDate}
`).join('\n')}

### 4. 任务要求
一、内容生成：
1. 个人简介 (personalIntroduction): 必须展现出对该岗位极高的专业度和热忱。
2. 专业技能 (professionalSkills): 
   - 最多生成 4 个大类，每个大类包含 3-4 个要点。
   - 优先从【用户基础信息】的“技能清单”中挑选与“目标岗位”高度相关的技能。
   - 丢弃与目标岗位无关的技能。
   - 如果用户技能不足，请根据目标岗位要求，合理推断并补充相关专业技能。
3. 工作职责 (responsibilities): 每段经历生成 4-6 条具体的职责描述。严禁用词空洞，必须有具体的业务动作。根据用户的“身份”(${profile.identity})和“工作年限”来调整描述的专业深度。

二、排版与标签：
1. 整个简历中，必须包含 3-4 处加粗 (使用 <b> 标签) 和 3-4 处下划线 (使用 <u> 标签)。
2. 每个标签包裹的内容不得超过 10 个汉字。

### 5. 输出格式
请直接返回 JSON 格式，不要包含任何 Markdown 代码块。格式：
{
  "position": "${baseData.position}",
  "yearsOfExperience": 数字,
  "personalIntroduction": "内容...",
  "professionalSkills": [{ "title": "类别", "items": ["要点1", "..."] }],
  "workExperience": [{
    "company": "...",
    "position": "适配后的新职位",
    "startDate": "...",
    "endDate": "...",
    "responsibilities": ["职责1...", "职责2..."]
  }]
}

输出语言: ${isEnglish ? 'English' : 'Chinese'}
`;

    try {
      const aiResponse = await this.gemini.generateContent(prompt);
      // 清理可能的 Markdown 标记
      const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const enhancedData = JSON.parse(jsonStr);

      // 合并数据并增加防 undefined 逻辑
      const finalPosition = (enhancedData.position && enhancedData.position !== "undefined") 
        ? enhancedData.position 
        : baseData.position;

      return {
        ...baseData,
        position: finalPosition,
        yearsOfExperience: enhancedData.yearsOfExperience || baseData.yearsOfExperience,
        personalIntroduction: enhancedData.personalIntroduction,
        professionalSkills: enhancedData.professionalSkills,
        workExperience: enhancedData.workExperience,
      };
    } catch (error) {
      console.error("AI 增强失败，降级使用原始数据:", error);
      return baseData;
    }
  }
}
