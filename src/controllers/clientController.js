import Client from '../models/Client.js';

// GET /api/clients
export async function listClients(req, res, next) {
  try {
    const { accountManagerId, search } = req.query;
    const filter = {};
    if (accountManagerId) filter.accountManagerId = accountManagerId;
    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { pcnNumber:  { $regex: search, $options: 'i' } },
        { surgeryName:{ $regex: search, $options: 'i' } },
      ];
    }
    const clients = await Client.find(filter).sort({ name: 1 });
    res.json({ clients });
  } catch (err) { next(err); }
}

// POST /api/clients
export async function createClient(req, res, next) {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) { next(err); }
}

// GET /api/clients/:clientId
export async function getClient(req, res, next) {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) return res.status(404).json({ error: 'not_found', message: 'Client not found' });
    res.json(client);
  } catch (err) { next(err); }
}

// DELETE /api/clients/:id
export async function deleteClient(req, res, next) {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: 'not_found', message: 'Client not found' });
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) { next(err); }
}