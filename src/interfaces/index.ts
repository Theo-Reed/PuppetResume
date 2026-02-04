import { Router } from 'express';

// Modules
import resume from './resume';
import user from './user';
import search from './search';
import membership from './membership';
import jobs from './jobs';
import system from './system';

const router = Router();

// Debug middleware to see what's hitting the interface router
router.use((req, res, next) => {
  console.log(`[Interface Router] ${req.method} ${req.url}`);
  next();
});

// Root level health check
router.get('/api/ping', (req, res) => res.send('pong'));

const apiRouter = Router();

// Modular Registration
apiRouter.use(resume);
apiRouter.use(user);
apiRouter.use(search);
apiRouter.use(membership);
apiRouter.use(jobs);
apiRouter.use(system);

// Mount the apiRouter at /api
router.use('/api', apiRouter);

export default router;
