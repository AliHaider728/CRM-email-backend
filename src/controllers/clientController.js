// ─────────────────────────────────────────────────────────────────────────────
// controllers/clientController.js
// ─────────────────────────────────────────────────────────────────────────────

import Client        from '../models/Client.js';
import Email         from '../models/Email.js';
import TimelineEntry from '../models/TimelineEntry.js';
import Notification  from '../models/Notification.js';
import TeamMember    from '../models/TeamMember.js';
import EmailEngagement from '../models/EmailEngagement.js';

// ─── GET /api/clients ─────────────────────────────────────────────────────────
export async function listClients(req, res, next) {
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
        { email:       { $regex: search, $options: 'i' } },
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

// ─── POST /api/clients ────────────────────────────────────────────────────────
export async function createClient(req, res, next) {
  try {
    const { name, pcnNumber, surgeryName, email, phone } = req.body;

    if (!name || !pcnNumber)
      return res.status(400).json({
        error: 'validation_error',
        message: 'name and pcnNumber are required',
      });

    const client = await Client.create({
      name, pcnNumber, surgeryName, email, phone,
      emailCount: 0,
      unreadCount: 0,
    });

    res.status(201).json(client);
  } catch (err) { next(err); }
}

// ─── GET /api/clients/:clientId ───────────────────────────────────────────────
export async function getClient(req, res, next) {
  try {
    const client = await Client.findById(req.params.clientId);

    if (!client)
      return res.status(404).json({ error: 'not_found', message: 'Client not found' });

    res.json(client);
  } catch (err) { next(err); }
}

// ─── DELETE /api/clients/:id ──────────────────────────────────────────────────
export async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;

    const client = await Client.findById(id);
    if (!client)
      return res.status(404).json({ error: 'not_found', message: 'Client not found' });

    // Delete all associated records in parallel
    await Promise.all([
      Email.deleteMany({ clientId: id }),
      TimelineEntry.deleteMany({ clientId: id }),
      Notification.deleteMany({ clientId: id }),
      EmailEngagement.deleteMany({ clientId: id }),
    ]);

    await Client.findByIdAndDelete(id);

    if (client.accountManagerId) {
      await TeamMember.findByIdAndUpdate(client.accountManagerId, {
        $inc: { clientCount: -1 },
      });
    }

    res.json({ success: true, message: `Client "${client.name}" deleted successfully` });
  } catch (err) { next(err); }
}