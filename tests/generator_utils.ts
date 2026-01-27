
import { ResumeData, SkillCategory, Education, Certificate, WorkExperience } from '../src/types';

export class ResumeFactory {
    private baseData: ResumeData;

    constructor() {
        this.baseData = {
            name: "测试用户",
            position: "全栈开发工程师",
            avatar: "", // 可选路径
            contact: {
                phone: "13800138000",
                email: "test@example.com",
                wechat: "wx_test_001",
                website: "github.com/testuser"
            },
            yearsOfExperience: 5,
            education: [],
            personalIntroduction: "热爱技术，追求极致的用户体验。熟悉全栈开发流程，具备良好的团队协作能力和问题解决能力。",
            professionalSkills: [],
            workExperience: [],
            certificates: []
        };
    }

    public getBase(): ResumeData {
        return JSON.parse(JSON.stringify(this.baseData));
    }

    public static createSkills(categories: number, itemsPerCategory: number): SkillCategory[] {
        const skills: SkillCategory[] = [];
        const titles = ["Backend", "Frontend", "DevOps", "AI/LLM", "Database", "Cloud"];
        
        for (let i = 0; i < categories; i++) {
            const title = titles[i % titles.length] + " Expert";
            const items: string[] = [];
            for (let j = 0; j < itemsPerCategory; j++) {
                items.push(`Skill Point ${String.fromCharCode(65+i)}-${j+1}: 熟练掌握相关技术原理与应用`);
            }
            skills.push({ title, items });
        }
        return skills;
    }

    public static createEducation(level: 'bachelor' | 'masters' | 'phd', withDescription: boolean = false): Education[] {
        const educations: Education[] = [];
        const desc = withDescription ? "主修课程包括：高级算法、分布式系统设计、机器学习基础。在校期间获得多次国家级奖学金，发表顶会论文一篇。" : undefined;

        if (level === 'phd') {
            educations.push({
                school: "麻省理工学院 (MIT)",
                degree: "计算机科学 博士",
                graduationDate: "2026-06",
                description: desc
            });
        }
        if (level === 'phd' || level === 'masters') {
            educations.push({
                school: "清华大学",
                degree: "软件工程 硕士",
                graduationDate: "2023-06",
                description: desc
            });
        }
        
        educations.push({
            school: "浙江大学",
            degree: "计算机科学与技术 本科",
            graduationDate: "2020-06",
            description: desc
        });

        return educations;
    }

    public static createCertificates(count: number): Certificate[] {
        if (count === 0) return [];
        const certs: Certificate[] = [];
        const names = ["PMP 项目管理认证", "AWS 解决方案架构师", "CKA Kubernetes 管理员", "CFA 特许金融分析师 Level I", "软考高级系统架构师"];
        
        for (let i = 0; i < count; i++) {
            certs.push({
                name: names[i % names.length] || `未知证书 ${i+1}`,
                date: `${2020 + i}-0${(i % 9) + 1}`
            });
        }
        return certs;
    }

    public static createWorkExperience(jobs: number, responsibilitiesPerJob: number): WorkExperience[] {
         const works: WorkExperience[] = [];
         for(let i=0; i<jobs; i++) {
             // 随机文本长度，模拟真实感
             const texts = [
                 "负责核心系统架构重构，将单体应用拆分为微服务架构。",
                 "通过引入 Redis 缓存机制，将接口响应时间从 500ms 降低至 50ms，提升了用户体验。",
                 "主导了技术团队的代码规范制定，引入 CI/CD 流程，提升了 30% 的交付效率。",
                 "设计并落地了千万级高并发秒杀系统，成功抗住双十一流量洪峰。",
                 "优化数据库索引与查询语句，解决了慢查询导致的系统卡顿问题。",
                 "负责跨部门技术协调与沟通，确保项目通过多方安全审计与合规检查。",
                 "编写了超过 2万行的核心代码，覆盖了订单、支付、用户中心等关键模块。"
             ];
             
             works.push({
                 company: `模拟科技公司 No.${i+1}`,
                 position: "高级工程师",
                 startDate: `${2024 - Math.floor(i/2)}-01`,
                 endDate: i === 0 ? "至今" : `${2024 - Math.floor(i/2)}-12`,
                 responsibilities: Array(responsibilitiesPerJob).fill(0).map((_, idx) => 
                     `[P${idx}] ` + texts[idx % texts.length] + (Math.random() > 0.5 ? "具备良好的系统设计能力。" : "")
                 )
             });
         }
         return works;
    }

        return skills;
    }

    public static createLongIntro(length: 'short' | 'medium' | 'long' | 'super_long'): string {
        const base = "热爱技术，追求极致的用户体验。熟悉全栈开发流程，具备良好的团队协作能力和问题解决能力。";
        const extra = "在分布式系统、高并发实战中积累了丰富经验。深入理解JVM原理、MySQL索引优化、Redis缓存策略。曾主导过百万级用户量的系统重构，将响应时间降低了50%。";
        
        if (length === 'short') return base;
        if (length === 'medium') return base + extra;
        if (length === 'long') return (base + extra + base + extra);
        if (length === 'super_long') return (base + extra).repeat(5);
        
        return base;
    }

    public static generateProfile(options: {
        eduLevel?: 'bachelor' | 'masters' | 'phd' | 'none',
        eduDesc?: boolean,
        skillCats?: number,
        skillItems?: number,
        certCount?: number,
        jobCount?: number,
        respsPerJob?: number,
        introLength?: 'short' | 'medium' | 'long' | 'super_long'
    }): ResumeData {
        const factory = new ResumeFactory();
        const data = factory.getBase();
        
        if (options.introLength) {
            data.personalIntroduction = this.createLongIntro(options.introLength);
        }

        if (options.eduLevel !== 'none') {
            data.education = this.createEducation(options.eduLevel || 'bachelor', options.eduDesc || false);
        } else {
            data.education = [];
        }

        if (options.skillCats !== undefined) {
             data.professionalSkills = this.createSkills(options.skillCats, options.skillItems || 3);
        }

        if (options.certCount !== undefined) {
             data.certificates = this.createCertificates(options.certCount);
        }

        if (options.jobCount !== undefined) {
             data.workExperience = this.createWorkExperience(options.jobCount, options.respsPerJob || 4);
        }
        
        return data;
    }

    public static generateRandomCases(count: number): Array<{ data: ResumeData, filename: string, desc: string }> {
        const cases: Array<{ data: ResumeData, filename: string, desc: string }> = [];
        const factory = new ResumeFactory();
        
        for (let i = 1; i <= count; i++) {
            // 随机生成参数
            // 学历: 1-3段
            const eduCount = Math.floor(Math.random() * 3) + 1; 
            const eduLevel = eduCount === 3 ? 'phd' : (eduCount === 2 ? 'masters' : 'bachelor');
            
            // 工作: 2-6段
            const jobCount = Math.floor(Math.random() * 5) + 2; // 2 to 6
            
            // 技能: 3-5段
            const skillCats = Math.floor(Math.random() * 3) + 3; // 3 to 5
            
            // 证书: 0-3个
            const certCount = Math.floor(Math.random() * 4); // 0 to 3
            
            // 个人介绍: 随机长度
            const introLengths: ('short' | 'medium' | 'long')[] = ['short', 'medium', 'long'];
            const introLen = introLengths[Math.floor(Math.random() * 3)];
            
            // Gemini 模拟数据: 总是给足量数据 (7条职责, 5条技能)
            // 我们的算法需要负责裁剪
            const data = ResumeFactory.generateProfile({
                eduLevel,
                eduDesc: Math.random() > 0.5,
                skillCats,
                skillItems: 5,   // 固定 5 条技能
                certCount,
                jobCount,
                respsPerJob: 7,  // 固定 7 条职责 (Gemini Surplus)
                introLength: introLen
            });
            
            data.name = `User Case ${i}`;
            
            cases.push({
                data,
                filename: `test_sim_case_${String(i).padStart(2, '0')}.pdf`,
                desc: `Case ${i}: Jobs=${jobCount}, Skills=${skillCats}, Certs=${certCount}, Intro=${introLen}`
            });
        }
        
        return cases;
    }
}