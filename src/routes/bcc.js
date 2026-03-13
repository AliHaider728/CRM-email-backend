const { Router } = require('express');
const { ingestBccEmail } = require('../controllers/bccController');

const router = Router();

router.post('/ingest', ingestBccEmail);

module.exports = router;
