import { Router } from 'express';
import { systemConfig } from './systemConfig';

const router = Router();

router.post('/system-config', systemConfig);

export default router;
