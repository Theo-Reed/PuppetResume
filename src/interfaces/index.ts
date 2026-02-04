import { Router } from 'express';
import resume from './resume/index';
import membership from './membership/index';
import user from './user/index';
import jobs from './jobs/index';
import search from './search/index';
import system from './system/index';

const router = Router();

// Handle /api prefix
const apiRouter = Router();

apiRouter.use(resume);
apiRouter.use(membership);
apiRouter.use(user);
apiRouter.use(jobs);
apiRouter.use(search);
apiRouter.use(system);

router.use('/api', apiRouter);

export default router;
