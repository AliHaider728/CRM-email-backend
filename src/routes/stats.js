const { Router } = require('express');
const { getOverview } = require('../controllers/statsController');

const router = Router();

router.get('/overview', getOverview);

module.exports = router;
