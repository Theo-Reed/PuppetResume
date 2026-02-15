import { Router } from 'express';
import initUser from './initUser';
import login from './login';
import getPhoneNumber from './getPhoneNumber';
import updateUserProfile from './updateUserProfile';
import updateUserLanguage from './updateUserLanguage';
import upload from './upload';
import ocr from './ocr';

const router = Router();

router.use(initUser);
router.use(login);
router.use(getPhoneNumber);
router.use(updateUserProfile);
router.use(updateUserLanguage);
router.use(upload);
router.use(ocr);

export default router;
