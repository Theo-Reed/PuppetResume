import { Router } from 'express';
import registerHandler from './register';
import loginHandler from './login';
import loginByOpenidHandler from './loginByOpenid';

const router = Router();

// 直接显式挂载到路由器，避免深层嵌套导致的路径不匹配
router.post('/register', (req, res, next) => {
    // 确保调用导出的是 router 还是 handler
    // 如果 loginByOpenid.ts 导出的是 router，则这样使用：
    loginByOpenidHandler(req, res, next);
});

// 为了极致的兼容性，我们换一种更稳妥的注册方式：
// 既然 auth/ 下的文件原本就是 Router，我们给它们指定明确的文件名为前缀
router.use('/', registerHandler);
router.use('/', loginHandler);
router.use('/', loginByOpenidHandler);

export default router;
