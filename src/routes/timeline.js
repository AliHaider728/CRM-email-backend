import { Router } from 'express';
import { getTimeline, addNote } from '../controllers/timelineController.js';
const router = Router();
router.get('/clients/:clientId/timeline', getTimeline);
router.post('/notes',                     addNote);
export default router;