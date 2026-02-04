import { Router } from 'express';
import systemConfig from './systemConfig';

const router = Router();

router.use(systemConfig);

export default router;
