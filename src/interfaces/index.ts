import { Router } from 'express';
import resume from './resume';
import membership from './membership';
import user from './user';
import jobs from './jobs';
import search from './search';
import system from './system';

const router = Router();

// Modular Routes
router.use('/api', resume);
router.use('/api', membership);
router.use('/api', user);
router.use('/api', jobs);
router.use('/api', search); 
router.use('/api', system);

export default router;
