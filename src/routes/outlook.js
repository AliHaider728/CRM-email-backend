import { Router } from 'express';
import {
  initiateAuth,
  handleCallback,
  triggerSync,
  getStatus,
} from '../controllers/outlookController.js';

const router = Router();

router.get('/auth/:memberId',   initiateAuth);    // GET /api/outlook/auth/:memberId
router.get('/callback',         handleCallback);  // GET /api/outlook/callback
router.post('/sync',            triggerSync);     // POST /api/outlook/sync
router.get('/status/:memberId', getStatus);       // GET /api/outlook/status/:memberId

export default router;