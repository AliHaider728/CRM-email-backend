// src/routes/clients.js
import { Router } from 'express';
import { listClients, createClient, getClient, deleteClient } from '../controllers/clientController.js';
const r = Router();
r.get('/',          listClients);
r.post('/',         createClient);
r.get('/:clientId', getClient);
r.delete('/:id',    deleteClient);
export default r;