const TeamMember = require('../models/TeamMember');

// GET /api/team
async function listTeamMembers(_req, res, next) {
  try {
    const members = await TeamMember.find().sort({ name: 1 });
    res.json({ members });
  } catch (err) { next(err); }
}

// POST /api/team
async function createTeamMember(req, res, next) {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'validation_error', message: 'name and email are required' });
    }
    const initials   = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const username   = email.split('@')[0].toLowerCase().replace(/\W/g, '');
    const bccAddress = `bcc+${username}@crm.yourdomain.com`;

    const member = await TeamMember.create({
      name, email, role: role || 'Account Manager',
      avatarInitials: initials, bccAddress,
      outlookConnected: false, emailCount: 0, clientCount: 0,
    });
    res.status(201).json(member);
  } catch (err) { next(err); }
}

// GET /api/team/:memberId
async function getTeamMember(req, res, next) {
  try {
    const member = await TeamMember.findById(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'not_found', message: 'Team member not found' });
    res.json(member);
  } catch (err) { next(err); }
}

// GET /api/team/:memberId/bcc-address
async function getBccAddress(req, res, next) {
  try {
    const member = await TeamMember.findById(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'not_found', message: 'Team member not found' });
    res.json({
      memberId:     member._id,
      bccAddress:   member.bccAddress,
      instructions: `Add ${member.bccAddress} as BCC when sending emails from Outlook. The CRM will automatically log the email under the correct client.`,
    });
  } catch (err) { next(err); }
}

module.exports = { listTeamMembers, createTeamMember, getTeamMember, getBccAddress };
