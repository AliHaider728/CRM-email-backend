// src/routes/stats.js
import { Router } from 'express';
import { getOverview } from '../controllers/statsController.js';
const r = Router();
r.get('/overview', getOverview);
export default r;