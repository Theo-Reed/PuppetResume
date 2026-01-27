
import { ResumeGenerator } from '../src/resumeGenerator';
import { ResumeData } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

// Mock Data Generator
function generateMockData(caseNum: number, jobs: number, skills: number, certs: number): ResumeData {
  return {
    name: `Test User ${caseNum}`,
    position: "Senior Software Engineer",
    yearsOfExperience: 5 + Math.floor(Math.random() * 5),
    languages: "chinese",
    contact: { phone: "13800138000", email: "test@example.com", wechat: "wx_test" },
    avatar: "https://file.wechat.com/avatar.png",
    personalIntroduction: "Experienced engineer " + "very long text ".repeat(10),
    education: [{ school: "University A", degree: "Bachelor", graduationDate: "2014" }],
    workExperience: Array(jobs).fill(0).map((_, i) => ({
      company: `Company ${i + 1}`,
      position: "Developer",
      startDate: "2015",
      endDate: "Present",
      description: Array(6).fill("Did impactful work " + "content ".repeat(5)).join("\n")
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

async function runTest() {
  const generator = new ResumeGenerator();
  await generator.init();

  console.log("Initializing Test with Retry Validation...");

  // Case A: Difficult Case (Likely to trigger retries)
  // High job count, awkward length
  const difficultCase = generateMockData(99, 11, 5, 2); 
  
  try {
      console.log(`\nGenerating Difficult Case (Jobs=11, Skills=5)...`);
      const pdfBuffer = await generator.generatePDF(difficultCase);
      if (typeof pdfBuffer !== 'string' && pdfBuffer.length > 0) { // check if it's buffer or string path
           fs.writeFileSync('tests/retry_test_pass.pdf', pdfBuffer);
           console.log("✅ Difficult Case Passed");
      }
  } catch (e: any) {
      console.log(`❌ Difficult Case Failed as expected if no layout found: ${e.message}`);
  }

  await generator.close();
}

runTest().catch(console.error);
