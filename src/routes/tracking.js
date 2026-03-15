// ─────────────────────────────────────────────────────────────────────────────
// routes/tracking.js
// Mount in index.js as: app.use('/api/track', trackingRoutes);
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { trackPixel, trackClick } from '../controllers/emailController.js';

const router = Router();

// ─── Pixel open tracking ──────────────────────────────────────────────────────
// Embed this in every outbound email HTML:
// <img src="https://crm-email-backend.vercel.app/api/track/open/EMAIL_ID/RECIPIENT_EMAIL"
//      width="1" height="1" style="display:none" />
router.get('/open/:emailId/:recipientEmail', trackPixel);

// ─── Link click tracking ──────────────────────────────────────────────────────
// Replace href links before sending:
// Original:  href="https://nhs.uk/report"
// Wrapped:   href="https://crm-email-backend.vercel.app/api/track/click/EMAIL_ID?url=https%3A%2F%2Fnhs.uk%2Freport&email=RECIPIENT"
router.get('/click/:emailId', trackClick);

export default router;