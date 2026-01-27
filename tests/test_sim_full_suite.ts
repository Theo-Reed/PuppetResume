
import { ResumeGenerator } from '../src/resumeGenerator';
import { ResumeData } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

// Mock Data Generator
function generateMockData(caseNum: number, jobs: number, skills: number, certs: number): ResumeData {
  return {
    name: `Test User ${caseNum}`,
    position: "Senior Software Engineer",
    yearsOfExperience: 5,
    languages: "chinese",
    contact: { phone: "13800138000", email: "test@example.com", wechat: "wx_test" },
    avatar: "https://file.wechat.com/avatar.png",
    personalIntroduction: "Experienced engineer " + "very long text ".repeat(5),
    education: [{ school: "University A", degree: "Bachelor", graduationDate: "2014" }],
    workExperience: Array(jobs).fill(0).map((_, i) => ({
      company: `Company ${i + 1}`,
      position: "Developer",
      startDate: "2015",
      endDate: "Present",
      responsibilities: Array(7).fill(0).map((_, j) => `Did impactful work ${j + 1} ` + "content ".repeat(5))
    })),
    professionalSkills: Array(skills).fill(0).map((_, i) => ({
      title: `Skillset ${i + 1}`,
      items: ["React", "Node.js", "TypeScript", "Docker", "Kubernetes", "AWS"]
    })),
    certificates: Array(certs).fill(0).map((_, i) => ({
      name: `Certificate ${i + 1}`,
      date: "2023"
    }))
  };
}

async function runSimulation() {
  const generator = new ResumeGenerator();
  await generator.init();

  console.log("Initializing Full Suite Simulation (20 Cases)...");
  
  // Define 20 diverse scenarios
  // Format: [Jobs, Skills, Certs]
  const scenarios = [
      [6, 5, 0], // 01: Standard Full 2 Page
      [3, 3, 1], // 02: Light
      [6, 5, 0], // 03: Repeat Standard
      [5, 3, 3], // 04: Heavy Certs
      [4, 3, 3], // 05: Balanced
      [4, 5, 0], // 06: Skill Heavy
      [6, 4, 3], // 07: Very Heavy (Orphan Risk)
      [5, 4, 3], // 08: Heavy
      [6, 3, 0], // 09: Job Heavy
      [5, 4, 1], // 10: Standard
      [2, 5, 2], // 11: Light Jobs, Heavy Skills
      [2, 3, 1], // 12: Very Light (Risk: Empty Page 2?)
      [5, 4, 3], // 13: Heavy
      [5, 3, 2], // 14: Standard
      [5, 5, 1], // 15: Heavy
      [3, 5, 1], // 16: Light Jobs
      [3, 5, 1], // 17: Repeat
      [3, 4, 1], // 18: Light
      [3, 5, 3], // 19: Skill/Cert Heavy (Orphan Risk)
      [6, 4, 2], // 20: Full
      [11, 5, 2] // 21: Extreme Case (Added for Jitter Test)
  ];

  for (let i = 0; i < scenarios.length; i++) {
      const [jobs, skills, certs] = scenarios[i];
      const caseNum = i + 1;
      const fileName = `test_sim_full_${caseNum.toString().padStart(2, '0')}.pdf`;
      
      console.log(`\nGenerating Case ${caseNum}: Jobs=${jobs}, Skills=${skills}, Certs=${certs}...`);
      
      const data = generateMockData(caseNum, jobs, skills, certs);
      
      try {
          const result = await generator.generatePDF(data);
          
          if (typeof result !== 'string' && result.length > 0) {
             fs.writeFileSync(path.join('tests', fileName), result);
             console.log(`✅ ${fileName} Generated Successfully`);
          }
      } catch (error: any) {
          console.error(`❌ Case ${caseNum} Failed: ${error.message}`);
      }
  }

  await generator.close();
}

runSimulation().catch(console.error);
