const { Router } = require('express');
const { listNotifications, markRead } = require('../controllers/notificationController');

const router = Router();

router.get('/',                          listNotifications);
router.post('/:notificationId/read',     markRead);

module.exports = router;
