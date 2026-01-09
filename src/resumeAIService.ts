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

    // 辅助函数：校验字段是否合法（非空且非 AI 占位符）
    const isIllegal = (val: any) => {
      if (val === undefined || val === null) return true;
      const s = String(val).trim().toLowerCase();
      // 过滤常见的 AI 逃避性占位符
      return s === "" || s === "undefined" || s === "null" || s === "nan" || s === "暂无" || s === "none";
    };

    // 直接取值，不再做复杂判断，因为你确认它不为空
    const targetTitle = isEnglish ? (job.title_english || job.title_chinese) : job.title_chinese;

    // 1. 计算最早可工作时间
    const birthYear = parseInt(profile.birthday?.split('-')[0] || "2000");
    const earliestWorkYear = birthYear + 19;
    const earliestWorkDate = `${earliestWorkYear}-07`;

    // 2. 构造 Prompt
    const prompt = `
你是一位顶级的简历包装专家。你的核心原则是：【一切以目标岗位为准】。

### 🚨 核心指令 (必须严格执行)
1. **身份锁死**：生成的简历【职位名称】(\`position\`) 必须且只能是：“${targetTitle}”。
2. **彻底抹除无关背景**：如果用户原始背景与“${targetTitle}”不相符，必须在职责描述中【彻底移除】原有的不相关技术栈或业务痕迹。
3. **经历强力重塑**：
   - 保持公司名称和时间段不变，根据“业务方向”将职位名和职责重写为与“${targetTitle}”高度匹配的角色。
   - **职级命名原则 (SENIORITY GUIDELINES)**：严禁盲目使用“资深”字眼。请优先考虑使用“高级”作为职级提升的描述，并根据工作年限合理分配：
     - 累计年限 < 3年：严禁出现“高级”、“资深”。
     - 累计年限 3-7年：推荐使用“高级(Senior)”，禁止使用“资深”。
     - 累计年限 7年以上：可根据实际业务量级使用“高级”或慎重使用“资深”。

### 1. 目标岗位信息
- 岗位名称: ${targetTitle}
- 岗位描述: ${job.description_chinese}
- 经验要求: ${job.experience}

### 2. 用户背景
- 姓名: ${profile.name}
- AI 指令: ${profile.aiMessage}
- 最早工作日限制: ${earliestWorkDate}

### 3. 工作经历 (需根据业务方向进行完全重塑)
${profile.workExperiences.map((exp, i) => `
经历 ${i + 1}:
- 公司: ${exp.company}
- 原始职位: ${exp.jobTitle}
- 业务方向: ${exp.businessDirection}
- 时间: ${exp.startDate} 至 ${exp.endDate}
`).join('\n')}

### 4. 任务
1. 个人简介: 表现出是“${targetTitle}”领域的专业人士。
2. 专业技能: 最多 4 个大类，每类 3-4 点。
3. 工作职责: 每段经历 4-6 条，使用行业术语。
4. 排版: 3-4 处 <b> 加粗，3-4 处 <u> 下划线。

### 5. 输出格式 (纯 JSON)
{
  "position": "${targetTitle}",
  "yearsOfExperience": ${baseData.yearsOfExperience || 5},
  "personalIntroduction": "...",
  "professionalSkills": [{ "title": "类别", "items": [...] }],
  "workExperience": [{ "company": "...", "position": "适配后的新职位", "startDate": "...", "endDate": "...", "responsibilities": [...] }]
}

输出语言: ${isEnglish ? 'English' : 'Chinese'}
`;

    try {
      const aiResponse = await this.gemini.generateContent(prompt, (text) => {
        try {
          const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const data = JSON.parse(jsonStr);
          
          // 严格验证字段，如果缺失或包含非法内容，返回 false 触发重试/切模型
          const requiredFields = ['position', 'yearsOfExperience', 'personalIntroduction', 'professionalSkills', 'workExperience'];
          for (const field of requiredFields) {
            if (isIllegal(data[field])) {
              throw new Error(`关键字段 "${field}" 内容非法或缺失`);
            }
          }
          return true;
        } catch (e: any) {
          throw new Error(`JSON 逻辑校验未通过: ${e.message}`);
        }
      });

      // 如果能执行到这里，说明已经通过了上面的 validator 校验
      const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const enhancedData = JSON.parse(jsonStr);

      // 合并数据
      return {
        ...baseData,
        position: targetTitle, // 依然强制使用我们预期的标题
        yearsOfExperience: enhancedData.yearsOfExperience,
        personalIntroduction: enhancedData.personalIntroduction,
        professionalSkills: enhancedData.professionalSkills,
        workExperience: enhancedData.workExperience,
      };
    } catch (error: any) {
      // 这里的错误会向上抛给 runBackgroundTask，从而触发数据库状态更新为 failed
      console.error("AI 增强流程异常:", error.message);
      throw error;
    }
  }
}
