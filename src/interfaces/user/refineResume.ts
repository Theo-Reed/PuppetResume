import { Router, Request, Response } from 'express';
import multer from 'multer';
import { GeminiService } from '../../geminiService';

const router = Router();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * 简历润色 API
 * 接收简历文件 (PDF/Docx/Image)，返回优化后的建议和内容
 */
router.post('/refine-resume', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '请上传简历文件' });
        }

        const gemini: GeminiService = req.app.locals.services.gemini;
        
        const prompt = `你是一个资深的职业规划师和简历专家。
请阅读上传的这份简历内容，并进行深度的“润色”和优化。

你的目标是：
1. 语言表达：将普通、平淡的描述改为更具职业感的动词（如：将“负责写代码”优化为“主导核心模块架构设计与高效性能优化”）。
2. 项目深度：提炼项目中的技术难点和可量化成果（如：提升了多少效率，降低了多少成本）。
3. 版式建议：如果发现简历结构不合理，给出具体建议。

请输出以下 JSON 格式：
{
  "summary": "简历整体评价和核心优势总结",
  "optimization_points": [
    "具体的优化建议1",
    "具体的优化建议2"
  ],
  "polished_content": "润色后的核心经历描述（Markdown 格式，包含 2-3 个核心项目的深度优化版）",
  "score": 85
}

注意：
1. 请直接针对简历中的语言进行文字上的打磨，而不仅仅是给建议。
2. 严禁输出 JSON 以外的文字。
3. 语言应与简历原文语言保持一致。`;

        console.log(`[Refine] 收到简历上传: ${req.file.originalname} (${req.file.size} bytes)`);
        
        // 使用 analyzeImage 同样可以处理 PDF 等多模态输入（只要 Gemini 模型支持）
        const resultText = await gemini.analyzeImage(prompt, req.file.buffer, req.file.mimetype);
        
        let extractedData;
        try {
            const cleanedJson = resultText.replace(/```json\n?|\n?```/g, '').trim();
            extractedData = JSON.parse(cleanedJson);
        } catch (parseError) {
            console.error('JSON Parse Error from AI:', resultText);
            throw new Error('AI 返回的格式不符合规范');
        }

        res.json({
            success: true,
            result: extractedData
        });

    } catch (error: any) {
        console.error('Refine Error:', error);
        res.status(500).json({
            success: false,
            message: '润色失败：' + (error.message || '未知错误')
        });
    }
});

export default router;
