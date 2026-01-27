
import { ResumeGenerator } from '../src/resumeGenerator';
import { ResumeData } from '../src/types';
import path from 'path';

// Base Data Clone Helper
const getBaseData = (): ResumeData => ({
    name: "于海涛",
    position: "平台研发工程师",
    avatar: "",
    contact: {
        phone: "18741938886",
        email: "theoreed19971011@gmail.com",
        wechat: "Finn0831",
        website: "github.com/Theo-Reed"
    },
    // We adjust this based on jobs
    yearsOfExperience: 5,
    education: [
        {
            school: "中国农业大学",
            degree: "硕士",
            graduationDate: "2026-06",
            description: "农业工程与信息技术"
        },
        {
            school: "大连外国语大学",
            degree: "本科",
            graduationDate: "2022-06",
            description: "网络工程"
        }
    ],
    personalIntroduction: "<b>资深全栈工程师</b>，拥有 6 年后端架构与分布式平台研发经验，具备卓越的英文工作环境适应能力与跨国协作经验。本人曾深度参与美国硅谷 A 轮初创企业核心系统建设，能够流畅使用全英文进行技术方案评审与文档撰写，累计交付<b>千万级用户量</b>的产品功能。<br>以及无缝对接全球化研发团队，主导了多个高并发系统的技术选型与重构工作。热衷于开源技术分享，维护有 2k+ Star 的技术博客，<b>致力于用技术创造商业价值</b>。",
    professionalSkills: [
        {
            title: "后端开发",
            items: ["精通 Go/Java 语言", "熟悉高性能中间件", "具备千万级架构设计能力", "熟悉 Docker/K8s 容器化技术", "熟悉 Go/Java 语言", "熟悉高性能中间件", "具备千万级架构设计能力", "熟悉 Docker/K8s 容器化技术"]
        },
        {
            title: "前端技术",
            items: ["熟悉 React/Vue 框架", "掌握 TypeScript/ES6+", "了解 Webpack/Vite 构建工具", "具备响应式页面开发能力", "熟悉 React/Vue 框架", "掌握 TypeScript/ES6+", "了解 Webpack/Vite 构建工具", "具备响应式页面开发能力"]
        },
        {
            title: "数据库",
            items: ["精通 MySQL/PostgreSQL", "熟悉 Redis/Memcached 缓存", "了解 MongoDB/Elasticsearch", "具备分库分表实战经验", "精通 MySQL/PostgreSQL", "熟悉 Redis/Memcached 缓存", "了解 MongoDB/Elasticsearch", "具备分库分表实战经验"]
        },
        {
            title: "工程实践",
            items: ["熟悉 Git 协同工作流", "掌握 CI/CD 自动化部署", "具备 TDD/BDD 测试意识", "熟悉 Agile/Scrum 敏捷开发", "熟悉 Git 协同工作流", "掌握 CI/CD 自动化部署", "具备 TDD/BDD 测试意识", "熟悉 Agile/Scrum 敏捷开发"]
        }
    ],
    workExperience: [],
    certificates: [
        { name: "CET-6", date: "2020" },
        { name: "PMP", date: "2021" },
        { name: "AWS SAA", date: "2022" },
        { name: "CKA", date: "2023" }
    ]
});

// Helper to generate long responsibilities
function generateResponsibilities(count: number, jobIdx: number): string[] {
    const longText = "负责高性能系统的设计与实现，主导了微服务架构的拆分与重构，通过优化缓存策略与数据库索引，成功将系统吞吐量提升了 200%，并降低了 30% 的延迟。";
    return Array(count).fill(0).map((_, i) => `<b>项目业绩 ${jobIdx+1}-${i+1}</b>：${longText}`);
}

// Helper to create specific number of jobs
function createJobs(count: number) {
    const jobs = [];
    const companies = ["Google", "Microsoft", "ByteDance", "Tencent", "Alibaba", "Amazon", "Tesla", "SpaceX", "OpenAI"];
    
    for (let i = 0; i < count; i++) {
        jobs.push({
            company: companies[i % companies.length],
            position: "Senior Software Engineer",
            startDate: `${2023-i}-01`,
            endDate: (i === 0) ? "Present" : `${2023-i}-12`,
            // Give plenty of bullets so the layout solver has to work
            responsibilities: generateResponsibilities(8, i) 
        });
    }
    return jobs;
}

// Random helpers
const randomBool = () => Math.random() > 0.5;

async function runSimulationSuite() {
    const generator = new ResumeGenerator();
    console.log('Initializing Generator...');
    await generator.init();

    try {
        // --- Phase 1: 1 to 6 Jobs (12 Segments) ---
        console.log('\n=== Phase 1: Generating 1-6 Job Variants (12 files) ===');
        
        // Strategy: For each job count 1..6, generate 2 variations
        for (let jobs = 1; jobs <= 6; jobs++) {
            for (let variant = 1; variant <= 2; variant++) {
                const data = getBaseData();
                
                // 1. Set Jobs
                data.workExperience = createJobs(jobs);
                data.yearsOfExperience = jobs * 2; // Rough estimate
                
                // 2. Randomize Education (Master vs Bachelor)
                const isMaster = randomBool();
                if (!isMaster) {
                    // Remove Master, keep only Bachelor (assumed 2nd item)
                    data.education = [data.education[1]]; 
                }
                
                // 3. Randomize Certs (Yes/No)
                const hasCerts = randomBool();
                if (!hasCerts) {
                    data.certificates = [];
                }

                // 4. Randomize Avatar (Yes/No)
                const hasAvatar = variant === 2; // Variant 1: No Avatar, Variant 2: Avatar
                if (hasAvatar) {
                    data.avatar = "/tests/avatar.png"; 
                } else {
                    data.avatar = "";
                }
                
                const filename = `sim_phase1_jobs${jobs}_v${variant}_${isMaster?'Master':'Bach'}_${hasCerts?'Cert':'NoCert'}_${hasAvatar?'Avatar':'NoAvatar'}.pdf`;
                console.log(`Generating ${filename}...`);
                
                const buffer = await generator.generatePDF(data);
                if (buffer) {
                    const fs = require('fs');
                    fs.writeFileSync(filename, buffer);
                    console.log(`✅ Saved ${filename}`);
                }
            }
        }

        // --- Phase 2: 7, 8, 9 Jobs (5 Segments) ---
        console.log('\n=== Phase 2: Generating 7-9 Job Variants (5 files) ===');
        
        // Distribution: 7 Jobs (2 files), 8 Jobs (2 files), 9 Jobs (1 file)
        const highJobCounts = [7, 7, 8, 8, 9];
        
        for (let i = 0; i < highJobCounts.length; i++) {
            const jobs = highJobCounts[i];
            const data = getBaseData();
            
            data.workExperience = createJobs(jobs);
            data.yearsOfExperience = jobs + 5;
            
            // Randomize
            const isMaster = randomBool();
            if (!isMaster) data.education = [data.education[1]];
            
            const hasCerts = randomBool();
            if (!hasCerts) data.certificates = [];

            // Add Random Avatar for Phase 2
            const hasAvatar = randomBool();
            if (hasAvatar) {
                data.avatar = "/tests/avatar.png";
            } else {
                data.avatar = "";
            }
            
            const filename = `sim_phase2_jobs${jobs}_v${i+1}_${isMaster?'Master':'Bach'}_${hasCerts?'Cert':'NoCert'}_${hasAvatar?'Avatar':'NoAvatar'}.pdf`;
            console.log(`Generating ${filename}...`);
            
            const buffer = await generator.generatePDF(data);
            if (buffer) {
                const fs = require('fs');
                fs.writeFileSync(filename, buffer);
                console.log(`✅ Saved ${filename}`);
            }
        }

    } catch (e) {
        console.error('Simulation Failed:', e);
    } finally {
        await generator.close();
    }
}

runSimulationSuite();
