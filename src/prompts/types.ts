import { JobData, UserResumeProfile } from '../types';

export interface PromptContext {
  targetTitle: string;
  job: JobData;
  requiredExp: { min: number; max: number };
  profile: UserResumeProfile;
  earliestWorkDate: string;
  actualExperienceText: string;
  totalMonths: number;
  needsSupplement: boolean;
  actualYears: number;
  supplementYears: number;
  finalTotalYears: number;
  supplementSegments: Array<{ startDate: string; endDate: string; years: number }>;
  allWorkExperiences: Array<{ startDate: string; endDate: string; type: 'existing' | 'supplement'; index?: number }>;
  seniorityThresholdDate?: string; // e.g. "2030-01" - limit for Senior/Manager titles
  
  // 排版控制元数据
  maxCharPerLine?: number;     // 每行目标字符数 (中文字符权重为1，英数权重为0.5)
}

export interface BulletPhaseWorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
}
