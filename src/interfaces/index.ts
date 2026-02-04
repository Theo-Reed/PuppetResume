import { Router } from 'express';

// Sub-routers
import deleteGeneratedResume from './resume/deleteGeneratedResume';
import retryGenerateResume from './resume/retryGenerateResume';
import restoreResume from './resume/restoreResume';
import generate from './resume/generate';
import getGeneratedResumes from './resume/getGeneratedResumes';

import getPhoneNumber from './user/getPhoneNumber';
import login from './user/login';
import initUser from './user/initUser';
import updateUserLanguage from './user/updateUserLanguage';
import updateUserProfile from './user/updateUserProfile';
import upload from './user/upload';
import ocr from './user/ocr';

import { getSavedSearchConditions } from './search/getSavedSearchConditions';
import deleteSearchCondition from './search/deleteSearchCondition';
import clearAllSearchConditions from './search/clearAllSearchConditions';
import saveSearchCondition from './search/saveSearchCondition';
import searchJobs from './search/searchJobs';
import searchMajors from './search/searchMajors';
import searchUniversities from './search/searchUniversities';

import { systemConfig } from './system/systemConfig';

import getMemberSchemes from './membership/getMemberSchemes';
import checkMemberStatus from './membership/checkMemberStatus';
import activateMembership from './membership/activateMembership';
import createOrder from './membership/createOrder';
import calculatePrice from './membership/calculatePrice';
import updateOrderStatus from './membership/updateOrderStatus';
import payCallback from './membership/payCallback';
import applyInviteCode from './membership/applyInviteCode';
import generateInviteCode from './membership/generateInviteCode';

import getPublicJobList from './jobs/getPublicJobList';
import getFeaturedJobList from './jobs/getFeaturedJobList';
import getJobDetail from './jobs/getJobDetail';
import saveJob from './jobs/saveJob';
import unsaveJob from './jobs/unsaveJob';
import checkJobSaved from './jobs/checkJobSaved';
import getSavedJobs from './jobs/getSavedJobs';
import batchSaveJobs from './jobs/batchSaveJobs';
import saveCustomJob from './jobs/saveCustomJob';

const router = Router();

// Debug middleware to see what's hitting the interface router
router.use((req, res, next) => {
  console.log(`[Interface Router] ${req.method} ${req.url}`);
  next();
});

// Root level health check
router.get('/api/ping', (req, res) => res.send('pong'));

const apiRouter = Router();

// Register all routers into apiRouter
apiRouter.use(deleteGeneratedResume);
apiRouter.use(retryGenerateResume);
apiRouter.use(restoreResume);
apiRouter.use(generate);
apiRouter.use(getGeneratedResumes);
apiRouter.use(getPhoneNumber);
apiRouter.use(login);
apiRouter.use(initUser);
apiRouter.use(updateUserLanguage);
apiRouter.use(updateUserProfile);
apiRouter.use(upload);
apiRouter.use(ocr);
apiRouter.post('/getSavedSearchConditions', getSavedSearchConditions);
apiRouter.use(deleteSearchCondition);
apiRouter.use(clearAllSearchConditions);
apiRouter.use(saveSearchCondition);
apiRouter.use(searchJobs);
apiRouter.use(searchMajors);
apiRouter.use(searchUniversities);
apiRouter.post('/system-config', systemConfig);
apiRouter.use(getMemberSchemes);
apiRouter.use(checkMemberStatus);
apiRouter.use(activateMembership);
apiRouter.use(createOrder);
apiRouter.use(calculatePrice);
apiRouter.use(updateOrderStatus);
apiRouter.use(payCallback);
apiRouter.use(applyInviteCode);
apiRouter.use(generateInviteCode);
apiRouter.use(getPublicJobList);
apiRouter.use(getFeaturedJobList);
apiRouter.use(getJobDetail);
apiRouter.use(saveJob);
apiRouter.use(unsaveJob);
apiRouter.use(checkJobSaved);
apiRouter.use(getSavedJobs);
apiRouter.use(batchSaveJobs);
apiRouter.use(saveCustomJob);

// Mount the apiRouter at /api
router.use('/api', apiRouter);

export default router;
