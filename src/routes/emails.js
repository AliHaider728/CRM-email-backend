import { Router } from 'express';
import { listEmails, logEmail, getEmail, trackEmail } from '../controllers/emailController.js';
const router = Router();
router.get('/',                listEmails);
router.post('/',               logEmail);
router.get('/:emailId',        getEmail);
router.post('/:emailId/track', trackEmail);
export default router;