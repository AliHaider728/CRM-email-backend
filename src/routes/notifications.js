import { Router } from 'express';
import { listNotifications, markRead } from '../controllers/notificationController.js';
const router = Router();
router.get('/',                      listNotifications);
router.post('/:notificationId/read', markRead);
export default router;