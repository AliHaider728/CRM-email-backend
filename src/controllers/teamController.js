// ─────────────────────────────────────────────────────────────────────────────
// controllers/teamController.js
// Manages team members and their BCC tracking addresses.
// Routes:
//   GET  /api/team
//   POST /api/team
//   GET  /api/team/:memberId
//   GET  /api/team/:memberId/bcc-address
// ─────────────────────────────────────────────────────────────────────────────

import TeamMember from '../models/TeamMember.js';

// ─── GET /api/team ────────────────────────────────────────────────────────────
// Returns all team members sorted alphabetically by name.
export async function listTeamMembers(_req, res, next) {
  try {
    const members = await TeamMember.find().sort({ name: 1 });
    res.json({ members });
  } catch (err) { next(err); }
}

// ─── POST /api/team ───────────────────────────────────────────────────────────
// Creates a new team member and auto-generates their unique BCC address.
// Body: { name*, email*, role }
// The BCC address format: bcc+<username>@crm.yourdomain.com
export async function createTeamMember(req, res, next) {
  try {
    const { name, email, role } = req.body;

    // name and email are required
    if (!name || !email)
      return res.status(400).json({
        error: 'validation_error',
        message: 'name and email are required',
      });

    // Auto-generate avatar initials from the full name (max 2 chars)
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Derive a clean username from the email local part for the BCC address
    const username   = email.split('@')[0].toLowerCase().replace(/\W/g, '');
    const bccAddress = `bcc+${username}@crm.yourdomain.com`;

    const member = await TeamMember.create({
      name, email,
      role:             role || 'Account Manager',
      avatarInitials:   initials,
      bccAddress,
      outlookConnected: false,
      emailCount:       0,
      clientCount:      0,
    });

    res.status(201).json(member);
  } catch (err) { next(err); }
}

// ─── GET /api/team/:memberId ──────────────────────────────────────────────────
// Returns a single team member by MongoDB _id.
export async function getTeamMember(req, res, next) {
  try {
    const member = await TeamMember.findById(req.params.memberId);

    if (!member)
      return res.status(404).json({ error: 'not_found', message: 'Team member not found' });

    res.json(member);
  } catch (err) { next(err); }
}

// ─── GET /api/team/:memberId/bcc-address ──────────────────────────────────────
// Returns the unique BCC address for a team member with usage instructions.
// Frontend uses this to display the copy-to-clipboard BCC setup card.
export async function getBccAddress(req, res, next) {
  try {
    const member = await TeamMember.findById(req.params.memberId);

    if (!member)
      return res.status(404).json({ error: 'not_found', message: 'Team member not found' });

    res.json({
      memberId:     member._id,
      bccAddress:   member.bccAddress,
      instructions: `Add ${member.bccAddress} as BCC when sending emails from Outlook. The CRM will automatically log the email under the correct client.`,
    });
  } catch (err) { next(err); }
}