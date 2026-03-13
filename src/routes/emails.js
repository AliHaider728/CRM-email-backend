const { Router } = require('express');
const { listEmails, logEmail, getEmail, trackEmail } = require('../controllers/emailController');

const router = Router();

router.get('/',              listEmails);
router.post('/',             logEmail);
router.get('/:emailId',      getEmail);
router.post('/:emailId/track', trackEmail);

module.exports = router;
