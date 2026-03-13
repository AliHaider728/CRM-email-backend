const Client = require('../models/Client');

// GET /api/clients
async function listClients(req, res, next) {
  try {
    const { search, accountManagerId } = req.query;
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { pcnNumber:   { $regex: search, $options: 'i' } },
        { surgeryName: { $regex: search, $options: 'i' } },
      ];
    }
    if (accountManagerId) filter.accountManagerId = accountManagerId;

    const [clients, total] = await Promise.all([
      Client.find(filter).skip(skip).limit(limit).sort({ lastContactedAt: -1 }),
      Client.countDocuments(filter),
    ]);

    res.json({ clients, total, page, limit });
  } catch (err) { next(err); }
}

// POST /api/clients
async function createClient(req, res, next) {
  try {
    const { name, pcnNumber, surgeryName, email, phone } = req.body;
    if (!name || !pcnNumber) {
      return res.status(400).json({ error: 'validation_error', message: 'name and pcnNumber are required' });
    }
    const client = await Client.create({ name, pcnNumber, surgeryName, email, phone, emailCount: 0, unreadCount: 0 });
    res.status(201).json(client);
  } catch (err) { next(err); }
}

// GET /api/clients/:clientId
async function getClient(req, res, next) {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) return res.status(404).json({ error: 'not_found', message: 'Client not found' });
    res.json(client);
  } catch (err) { next(err); }
}

module.exports = { listClients, createClient, getClient };
