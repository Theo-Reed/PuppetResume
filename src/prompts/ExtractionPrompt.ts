
export function generateExtractionPrompt(text?: string): string {
    const currentDate = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    return `
    You are an expert Resume Parser and Professional Translator. 
    Analyze the provided resume document (text or image) and extract the candidate's profile information into a strictly valid BILINGUAL JSON object.
    
    ### OUTPUT STRUCTURE
    The JSON structure must be EXACTLY as follows:
    {
      "language": "chinese" or "english" (primary source language),
      "mobile": "Phone Number",
      "email": "Email Address",
      "website": "Personal Website / Portfolio / Blog URL",
      "zh": {
        "name": "姓名",
        "gender": "男/女/其他",
        "wechat": "微信号",
        "education": [
          { "school": "学校名称", "degree": "学位", "major": "专业名称", "startTime": "YYYY-MM", "endTime": "YYYY-MM" }
        ],
        "experience": [
          { "company": "公司名称", "role": "职位", "startTime": "YYYY-MM", "endTime": "YYYY-MM", "description": "职责与成就" }
        ],
        "skills": ["技能1", "技能2"]
      },
      "en": {
        "name": "Full Name",
        "gender": "Male/Female/Other",
        "city": "City, Country (e.g. Singapore, London)",
        "linkedin": "LinkedIn Profile URL",
        "whatsapp": "WhatsApp Number/Handle",
        "telegram": "Telegram Handle",
        "education": [
          { "school": "Official English School Name", "degree": "Degree (e.g. Bachelor)", "major": "Major", "startTime": "YYYY-MM", "endTime": "YYYY-MM" }
        ],
        "experience": [
          { "company": "Company Name", "role": "English Job Title", "startTime": "YYYY-MM", "endTime": "YYYY-MM", "description": "Professional English descriptions" }
        ],
        "skills": ["Skill 1", "Skill 2"]
      }
    }
    
    ### CRITICAL RULES
    1. **Accuracy Over Completion**: ONLY extract information that is explicitly stated or clearly identifiable in the document. **If a field is missing, leave it as an empty string ("") or empty array ([]).** DO NOT hallucinate or guess URLs, dates, or contact info.
    2. **Bilingual Extraction**: You MUST provide content for BOTH blocks. If the source is Chinese, translate it to English for "en", and vice-versa. Names in "en" should be in Pinyin.
    3. **Language-Specific Fields**: 
       - For "zh": Focus on "wechat".
       - For "en": Focus on "city", "linkedin", "whatsapp", and "telegram".
       - "website" is common: Only extract if an actual personal site/portfolio URL is found.
    4. **Date Normalization**: Use YYYY-MM. Use "${currentDate}" for "Present" or "至今".
    5. **Merge Experience**: Include all professional history and major projects. Use project name as "company" if no company is listed.
    
    Only return valid JSON. No markdown tags.
    ${text ? `\n\n### RESUME CONTENT:\n${text}` : ""}
    `;
}
