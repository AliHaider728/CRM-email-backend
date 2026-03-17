// 
// routes/emails.js
// 

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

