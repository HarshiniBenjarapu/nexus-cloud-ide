import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { connectDatabase, getDatabaseCollections, runDatabaseQuery } from '../controllers/database.controller';

const router = Router();

router.use(protect);
router.post('/connect', connectDatabase);
router.get('/collections', getDatabaseCollections);
router.post('/query', runDatabaseQuery);

export default router;
