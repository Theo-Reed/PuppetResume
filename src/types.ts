/**
 * 联系方式
 */
export interface ContactInfo {
  /** 电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 微信 */
  wechat?: string;
}

/**
 * 教育背景
 */
export interface Education {
  /** 学校名称 */
  school: string;
  /** 学位/专业 */
  degree?: string;
  /** 毕业时间（格式：YYYY-MM 或 YYYY） */
  graduationDate: string;
  /** 其他描述/成就（可选） */
  description?: string;
}

/**
 * 工作经历
 */
export interface WorkExperience {
  /** 公司名称 */
  company: string;
  /** 职位 */
  position: string;
  /** 开始时间（格式：YYYY-MM） */
  startDate: string;
  /** 结束时间（格式：YYYY-MM 或 "至今"） */
  endDate: string;
  /** 工作职责和成就（数组，每个元素是一个要点） */
  responsibilities?: string[];
}

/**
 * 专业技能分类
 */
export interface SkillCategory {
  /** 技能分类标题 */
  title: string;
  /** 技能要点列表 */
  items: string[];
}

/**
 * 证书
 */
export interface Certificate {
  /** 证书名称 */
  name: string;
  /** 获取时间（可选，格式：YYYY-MM 或 YYYY） */
  date?: string;
  /** 成绩或描述（可选，如"580分"、"94/100"） */
  score?: string;
}

/**
 * 简历数据
 */
export interface ResumeData {
  /** 姓名 */
  name: string;
  /** 岗位 */
  position: string;
  /** 联系方式 */
  contact: ContactInfo;
  /** 几年经验 */
  yearsOfExperience: number;
  /** 语言能力（可选，如"中英双语"） */
  languages?: string;
  /** 头像（可选，支持 URL 或 Base64 格式，如 "https://example.com/avatar.jpg" 或 "data:image/jpeg;base64,..."） */
  avatar?: string;
  /** 教育背景（可以多个） */
  education: Education[];
  /** 个人介绍 */
  personalIntroduction: string;
  /** 专业技能（可选） */
  professionalSkills?: SkillCategory[];
  /** 工作经历 */
  workExperience: WorkExperience[];
  /** 证书（可选） */
  certificates?: Certificate[];
}

/**
 * 岗位信息 (Job Data)
 */
export interface JobData {
  /** 唯一标识 (MD5) */
  _id: string;
  /** 原始标题 */
  title: string;
  /** 优化后的中文职位名 */
  title_chinese: string;
  /** 英文职位名 */
  title_english: string;
  /** 公司/团队名称 */
  team: string;
  /** 原始标签 */
  summary: string;
  /** AI 提取的中文字段标签 (5-7个) */
  summary_chinese: string[];
  /** 标签的英文翻译 */
  summary_english: string[];
  /** 原始薪资 */
  salary: string;
  /** 标准化英文薪资 */
  salary_english: string;
  /** 发布日期 (YYYY-MM-DD) */
  createdAt: string;
  /** 来源平台 (BOSS直聘) */
  source_name: string;
  /** 来源平台英文名 */
  source_name_english: string;
  /** 原始详情页链接 */
  source_url: string;
  /** 岗位类别 (国内/国外/Web3) */
  type: string;
  /** 原始描述全文 */
  description: string;
  /** 结构化中文描述 */
  description_chinese: string;
  /** 结构化英文描述 */
  description_english: string;
  /** 城市 */
  city: string;
  /** 经验要求 */
  experience: string;
}

/**
 * 用户简历资料 (Resume Profile)
 */
export interface UserResumeProfile {
  /** 真实姓名 */
  name: string;
  /** 简历照片 Cloud ID */
  photo: string;
  /** 性别 */
  gender: string;
  /** 出生年月 (YYYY-MM) */
  birthday: string;
  /** 身份 (e.g., '在校生', '职场人') */
  identity: string;
  /** 简历联系微信 */
  wechat: string;
  /** 简历联系邮箱 */
  email: string;
  /** 简历联系电话 */
  phone: string;
  /** 教育经历 */
  educations: {
    school: string;
    degree: string;
    major: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  /** 证书列表 */
  certificates: string[];
  /** 技能列表 */
  skills: string[];
}

