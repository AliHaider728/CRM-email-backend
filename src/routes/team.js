const { Router } = require('express');
const { listTeamMembers, createTeamMember, getTeamMember, getBccAddress } = require('../controllers/teamController');

const router = Router();

router.get('/',                      listTeamMembers);
router.post('/',                     createTeamMember);
router.get('/:memberId',             getTeamMember);
router.get('/:memberId/bcc-address', getBccAddress);

module.exports = router;
