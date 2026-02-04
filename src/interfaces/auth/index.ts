import { Router } from 'express';
import register from './register';
import login from './login';
import loginByOpenid from './loginByOpenid';

const router = Router();

// 显式映射路径，避免子模块路径翻倍
router.use('/register', register);
router.use('/login', login);
router.use('/loginByOpenid', loginByOpenid);

export default router;
