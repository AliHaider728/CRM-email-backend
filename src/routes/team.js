import { Router } from 'express';
import { listTeamMembers, createTeamMember, getTeamMember, getBccAddress } from '../controllers/teamController.js';
const r = Router();
r.get('/',                      listTeamMembers);
r.post('/',                     createTeamMember);
r.get('/:memberId',             getTeamMember);
r.get('/:memberId/bcc-address', getBccAddress);
export default r;