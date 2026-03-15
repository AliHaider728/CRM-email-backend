import { Router } from 'express';
import { listClients, createClient, getClient } from '../controllers/clientController.js';
const router = Router();
router.get('/',          listClients);
router.post('/',         createClient);
router.get('/:clientId', getClient);
export default router;