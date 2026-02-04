import { Router } from 'express';
import searchJobs from './searchJobs';
import searchUniversities from './searchUniversities';
import searchMajors from './searchMajors';
import saveSearchCondition from './saveSearchCondition';
import getSavedSearchConditions from './getSavedSearchConditions';
import deleteSearchCondition from './deleteSearchCondition';
import clearAllSearchConditions from './clearAllSearchConditions';

const router = Router();

router.use(searchJobs);
router.use(searchUniversities);
router.use(searchMajors);
router.use(saveSearchCondition);
router.use(getSavedSearchConditions);
router.use(deleteSearchCondition);
router.use(clearAllSearchConditions);

export default router;
