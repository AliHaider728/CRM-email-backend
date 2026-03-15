import { Router } from 'express';
import { ingestBccEmail } from '../controllers/bccController.js';
const router = Router();
router.post('/ingest', ingestBccEmail);
export default router;