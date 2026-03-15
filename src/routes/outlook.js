import { Router } from 'express';
import { triggerSync } from '../controllers/outlookController.js';
const router = Router();
router.post('/sync', triggerSync);
export default router;