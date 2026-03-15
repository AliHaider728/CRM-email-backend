// ─────────────────────────────────────────────────────────────────────────────
// routes/emails.js
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  listEmails,
  logEmail,
  getEmail,
  trackEmail,
  getEmailEngagements,
} from '../controllers/emailController.js';

const router = Router();

// Standard CRUD
router.get('/',                    listEmails);           // GET  /api/emails
router.post('/',                   logEmail);             // POST /api/emails
router.get('/:emailId',            getEmail);             // GET  /api/emails/:emailId

// Engagement tracking (API-based, e.g. from frontend or Postman)
router.post('/:emailId/track',     trackEmail);           // POST /api/emails/:emailId/track

// WHO opened detail — used by frontend drawer
router.get('/:emailId/engagements', getEmailEngagements); // GET  /api/emails/:emailId/engagements

export default router;


// ─────────────────────────────────────────────────────────────────────────────
// routes/tracking.js  ← NEW FILE — add this as a separate file
// Mount in index.js as: app.use('/api/track', trackingRoutes);
// ─────────────────────────────────────────────────────────────────────────────

// import { Router } from 'express';
// import { trackPixel, trackClick } from '../controllers/emailController.js';
//
// const router = Router();
//
// // Pixel endpoint — embedded in email HTML
// // <img src="https://yourapi.vercel.app/api/track/open/EMAIL_ID/RECIPIENT_EMAIL" />
// router.get('/open/:emailId/:recipientEmail', trackPixel);
//
// // Link redirect — wrap links before sending
// // href="https://yourapi.vercel.app/api/track/click/EMAIL_ID?url=ORIGINAL_URL&email=RECIPIENT"
// router.get('/click/:emailId', trackClick);
//
// export default router;