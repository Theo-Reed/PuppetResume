import { Router } from 'express';
import register from './register';
import login from './login';
import loginByOpenid from './loginByOpenid';

const router = Router();

// 不再在 use 中指定路径，让子模块内自己定义路径（类似 user 模块的成功经验）
router.use(register);
router.use(login);
router.use(loginByOpenid);

export default router;
