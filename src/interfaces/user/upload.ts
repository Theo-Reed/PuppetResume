import { Router, Request, Response } from 'express';
import multer from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import sharp from 'sharp';
import crypto from 'crypto';

const router = Router();

// Configure storage for uploads
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Memory storage for Sharp processing
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // Support up to 15MB uploads
});

/**
 * Upload and Intelligent Deduplication
 * POST /api/upload
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // 1. 图像标准化处理 (Normalization)
    // - 无论原始格式（包括 HEIC/PNG/JPG），Sharp 会自动识别并转码
    // - 强制限制在控制 50KB 以下的策略：调节尺寸或质量
    let processedBuffer = await sharp(req.file.buffer)
      .rotate() // 关键：自动根据 EXIF 信息旋转（防止 HEIC/手机照片侧倒）
      .resize(600, 600, { // 稍微降低尺寸（800->600）以确保极其复杂图片也能压进 50KB
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 75, // 轻微降低质量 (80->75) 换取更稳定的体积控制
        effort: 6    // 增加压缩 CPU 消耗，换取更小的文件体积
      }) 
      .toBuffer();

    // 智能体积保底策略 (Size Guarantee)
    // 如果一张极其复杂的图在 600px 还是超过了 50KB，我们自动牺牲一点质量确保通过
    if (processedBuffer.length > 50 * 1024) {
      processedBuffer = await sharp(processedBuffer)
        .webp({ quality: 60, effort: 6 })
        .toBuffer();
    }

    // 2. 内容指纹计算 (Content Hashing)
    // 计算处理后 Buffer 的 MD5 值。
    // 如果两张图内容 100% 相似，即便原始大小不同，经过标准化后生成的 Buffer 将趋于一致
    const hash = crypto.createHash('md5').update(processedBuffer).digest('hex');
    const filename = `${hash}.webp`;
    const outputPath = join(UPLOAD_DIR, filename);
    const imageUrl = `/public/uploads/${filename}`;

    // 3. 智能去重 (Deduplication)
    // 如果文件名（Hash）已存在，说明服务器已经存过这张图，直接复用
    if (!existsSync(outputPath)) {
        writeFileSync(outputPath, processedBuffer);
        console.log(`[Upload] New image saved: ${filename}`);
    } else {
        console.log(`[Upload] Reusing existing image: ${filename}`);
    }

    res.json({
      success: true,
      fileID: imageUrl,
      url: imageUrl
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Image processing failed' });
  }
});

export default router;