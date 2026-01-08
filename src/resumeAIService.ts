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
你是一位专业的简历优化专家。请根据以下信息，为用户生成一份极具竞争力的简历内容。

### 1. 目标岗位信息
- 岗位名称: ${job.title_chinese} / ${job.title_english}
- 岗位描述: ${job.description_chinese}
- 经验要求: ${job.experience}

### 2. 用户基础信息
- 姓名: ${profile.name}
- 身份: ${profile.identity}
- 技能清单: ${(profile.skills || []).join(', ')}
- AI 指令: ${profile.aiMessage}
- 最早可开始工作时间限制: ${earliestWorkDate} (绝对不能早于此日期)

### 3. 当前工作经历 (含业务背景)
${profile.workExperiences.map((exp, i) => `
经历 ${i + 1}:
- 公司: ${exp.company}
- 原始职位: ${exp.jobTitle}
- 业务方向: ${exp.businessDirection}
- 时间: ${exp.startDate} 至 ${exp.endDate}
`).join('\n')}

### 4. 任务要求 (严格遵守)
一、工作经历增强逻辑：
1. 计算用户从第一份工作至今的总年限。如果不足 ${requiredYears} 年，请向前【补充】工作经历。
2. 补充经历的公司名为“某某方向工作室”，时间段每段不超过3年。
3. 补充经历的起始时间绝对不能早于 ${earliestWorkDate}。
4. 【核心】如果原始经历的职位与目标岗位不符，请根据“业务方向”重新拟定职位名称(jobTitle)和工作内容，使之完全契合目标岗位。

二、内容生成：
1. 个人简介 (personalIntroduction): 结合 AI 指令和岗位描述生成。
2. 专业技能 (professionalSkills): 
   - 最多生成 4 个大类，每个大类包含 3-4 个要点。
   - 优先从【用户基础信息】的“技能清单”中挑选与“目标岗位”高度相关的技能。
   - 丢弃与目标岗位无关的技能。
   - 如果用户技能不足，请根据目标岗位要求，合理推断并补充相关专业技能。
3. 工作职责 (responsibilities): 
   - 根据用户的“身份”(${profile.identity})和“工作年限”来调整描述的专业深度。
   - 若为“在校生”，重点突出潜力、学习能力和项目参与；若为“职场人”，重点突出核心贡献、解决问题的能力和业务结果。
   - 每段经历生成 4-6 条具体的职责描述。

三、排版与标签 (极其重要)：
1. 整个简历中，必须包含 3-4 处加粗 (使用 <b>标签) 和 3-4 处下划线 (使用 <u>标签)。
2. 每个标签包裹的内容不得超过 10 个汉字。
3. 重点加粗在：核心业绩、关键技能；下划线在：业务背景、项目量级。

### 5. 输出格式
请直接返回 JSON 格式，不要包含任何 Markdown 代码块标签。格式必须符合：
{
  "position": "优化后的职位名称",
  "yearsOfExperience": 数字(总年限),
  "personalIntroduction": "内容...",
  "professionalSkills": [{ "title": "类别", "items": ["要点1", "要点2"] }],
  "workExperience": [{
    "company": "公司名",
    "position": "职位名",
    "startDate": "YYYY-MM",
    "endDate": "YYYY-MM/至今",
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

      // 合并数据
      return {
        ...baseData,
        position: enhancedData.position || baseData.position,
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

