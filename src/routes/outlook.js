const { Router } = require('express');
const { triggerSync } = require('../controllers/outlookController');

const router = Router();

router.post('/sync', triggerSync);

module.exports = router;
