import { Router } from 'express';
import { listEmails, logEmail, getEmail, trackEmail, getEmailEngagements } from '../controllers/emailController.js';
const r = Router();
r.get('/',                      listEmails);
r.post('/',                     logEmail);
r.get('/:emailId',              getEmail);
r.post('/:emailId/track',       trackEmail);
r.get('/:emailId/engagements',  getEmailEngagements);
export default r;