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
  _id: string;
  title: string;
  title_chinese: string;
  title_english: string;
  team: string;
  summary: string;
  summary_chinese: string[];
  summary_english: string[];
  salary: string;
  salary_english: string;
  createdAt: string;
  source_name: string;
  source_name_english: string;
  source_url: string;
  type: string;
  description: string;
  description_chinese: string;
  description_english: string;
  city: string;
  experience: string;
}

/**
 * 用户简历资料 (Resume Profile)
 */
export interface UserResumeProfile {
  name: string;
  photo: string; // Cloud ID or HTTPS URL
  gender: string;
  birthday: string; // YYYY-MM
  identity: string; // '在校生', '职场人'
  wechat: string;
  email: string;
  phone: string;
  educations: {
    school: string;
    degree: string;
    major: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  workExperiences: {
    company: string;
    jobTitle: string;
    businessDirection: string;
    startDate: string;
    endDate: string;
  }[];
  certificates: string[];
  skills: string[];
  aiMessage: string;
}

/**
 * 前端发送的生成请求体
 */
export interface GenerateFromFrontendRequest {
  jobId: string;
  userId: string;
  language?: string;
  resume_profile: UserResumeProfile;
  job_data: JobData;
}

/**
 * 集中管理数据转换逻辑
 */
export function mapFrontendRequestToResumeData(payload: GenerateFromFrontendRequest): ResumeData {
  const profile = payload.resume_profile;
  const job = payload.job_data;
  const isEnglish = payload.language === 'english';

  return {
    name: profile.name,
    position: isEnglish ? (job.title_english || job.title) : (job.title_chinese || job.title),
    contact: {
      email: profile.email,
      wechat: profile.wechat,
      phone: profile.phone,
    },
    avatar: profile.photo,
    languages: isEnglish ? 'english' : 'chinese',
    yearsOfExperience: 0, // 默认 0，后续可根据工作经历计算
    education: profile.educations.map(edu => {
      // 处理学历显示逻辑：全日制只显示学位，非全日制额外标注
      let degreeDisplay = edu.degree;
      if (edu.degree.includes('全日制')) {
        degreeDisplay = edu.degree.replace(/\s*\(全日制\)\s*/g, '').replace(/全日制/g, '').trim();
      }
      
      return {
        school: edu.school,
        degree: `${edu.major} ${degreeDisplay}`,
        graduationDate: `${edu.startDate} - ${edu.endDate}`,
        description: edu.description
      };
    }),
    personalIntroduction: "", // 后续由 AI 生成
    workExperience: profile.workExperiences.map(exp => ({
      company: exp.company,
      position: exp.jobTitle,
      startDate: exp.startDate,
      endDate: exp.endDate,
      responsibilities: [] // 后续由 AI 生成
    })),
    certificates: (profile.certificates || []).map(cert => ({
      name: cert
    }))
  };
}

