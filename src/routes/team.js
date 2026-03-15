import { Router } from 'express';
import { listTeamMembers, createTeamMember, getTeamMember, getBccAddress } from '../controllers/teamController.js';
const router = Router();
router.get('/',                      listTeamMembers);
router.post('/',                     createTeamMember);
router.get('/:memberId',             getTeamMember);
router.get('/:memberId/bcc-address', getBccAddress);
export default router;