import { Router } from 'express';
// Explicitly define routes here instead of nesting routers to rule out path issues
import registerHandler from './register';
import loginHandler from './login';
import loginByOpenidHandler from './loginByOpenid';

const router = Router();

// If these are routers, using them directly is standard.
// If they were handlers, we'd use .post('/name', handler).
// But they were routers handling their own paths.
router.use(registerHandler);
router.use(loginHandler);
router.use(loginByOpenidHandler);

export default router;
