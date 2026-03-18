import { Router } from 'express';
import { trackPixel, trackClick } from '../controllers/emailController.js';

const router = Router();

// Pixel — embed as <img src="/api/track/open/EMAIL_ID/RECIPIENT_EMAIL" width="1" height="1" />
router.get('/open/:emailId/:recipientEmail', trackPixel);

// Click — wrap links as /api/track/click/EMAIL_ID?url=ENCODED_URL&email=RECIPIENT
router.get('/click/:emailId', trackClick);

export default router;