const { Router } = require('express');
const { listClients, createClient, getClient } = require('../controllers/clientController');

const router = Router();

router.get('/',           listClients);
router.post('/',          createClient);
router.get('/:clientId',  getClient);

module.exports = router;
