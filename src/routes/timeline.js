const { Router } = require('express');
const { getTimeline, addNote } = require('../controllers/timelineController');

const router = Router();

router.get('/clients/:clientId/timeline', getTimeline);
router.post('/notes',                     addNote);

module.exports = router;
