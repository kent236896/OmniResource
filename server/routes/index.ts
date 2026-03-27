import { Router } from 'express';
import systemRouter from './system.js';
import keywordsRouter from './keywords.js';
import searchRouter from './search.js';
import resourcesRouter from './resources.js';
import downloadRouter from './download.js';
import settingsRouter from './settings.js';
import sessionsRouter from './sessions.js';

const router = Router();

router.use(systemRouter);
router.use(keywordsRouter);
router.use(searchRouter);
router.use(resourcesRouter);
router.use(downloadRouter);
router.use(settingsRouter);
router.use(sessionsRouter);

export default router;
