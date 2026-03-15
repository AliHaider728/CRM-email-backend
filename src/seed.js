import  dotenv from 'dotenv';
dotenv.config();
import mongoose      from 'mongoose';
import Client        from './models/Client.js';
import TeamMember    from './models/TeamMember.js';
import Email         from './models/Email.js';
import TimelineEntry from './models/TimelineEntry.js';
import Notification  from './models/Notification.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Clearing existing data...');

  await Promise.all([
    Client.deleteMany({}),
    TeamMember.deleteMany({}),
    Email.deleteMany({}),
    TimelineEntry.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  // ─── Team Members ────────────────────────────────────────────────────────────
  const [alice, bob, carol] = await TeamMember.insertMany([
    {
      name: 'Alice Johnson', email: 'alice@nhscrm.com',
      role: 'Senior Account Manager', avatarInitials: 'AJ',
      bccAddress: 'bcc+alice@crm.yourdomain.com',
      outlookConnected: true, emailCount: 87, clientCount: 5,
    },
    {
      name: 'Bob Williams', email: 'bob@nhscrm.com',
      role: 'Account Manager', avatarInitials: 'BW',
      bccAddress: 'bcc+bob@crm.yourdomain.com',
      outlookConnected: true, emailCount: 64, clientCount: 4,
    },
    {
      name: 'Carol Davis', email: 'carol@nhscrm.com',
      role: 'Junior Account Manager', avatarInitials: 'CD',
      bccAddress: 'bcc+carol@crm.yourdomain.com',
      outlookConnected: false, emailCount: 42, clientCount: 3,
    },
  ]);

  // ─── Clients ─────────────────────────────────────────────────────────────────
  const [northLondon, meridian, eastMids] = await Client.insertMany([
    {
      name: 'North London PCN', pcnNumber: 'PCN-001',
      surgeryName: 'Highgate Surgery',
      email: 'contact@northlondonpcn.nhs.uk', phone: '+44 20 7946 0001',
      accountManagerId: alice._id, accountManagerName: alice.name,
      emailCount: 28, unreadCount: 3,
      lastContactedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      name: 'Meridian Health Group', pcnNumber: 'PCN-002',
      surgeryName: 'Meridian Medical Centre',
      email: 'admin@meridianhealth.nhs.uk', phone: '+44 20 7946 0002',
      accountManagerId: bob._id, accountManagerName: bob.name,
      emailCount: 19, unreadCount: 1,
      lastContactedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      name: 'East Midlands Surgeries', pcnNumber: 'PCN-003',
      email: 'info@eastmidspgn.nhs.uk', phone: '+44 115 946 0003',
      accountManagerId: carol._id, accountManagerName: carol.name,
      emailCount: 14, unreadCount: 0,
      lastContactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'South Yorkshire PCN', pcnNumber: 'PCN-004',
      email: 'hello@southyorkshirepcn.nhs.uk', phone: '+44 114 946 0004',
      accountManagerId: alice._id, accountManagerName: alice.name,
      emailCount: 11, unreadCount: 2,
      lastContactedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ]);

  // ─── Emails ───────────────────────────────────────────────────────────────────
  const email1 = await Email.create({
    subject: 'Q1 Pharmacy Review — North London PCN',
    direction: 'outbound', fromEmail: alice.email, fromName: alice.name,
    toEmail: northLondon.email, toName: northLondon.name,
    bodyPreview: "Following up on last week's review meeting, please find the action plan attached.",
    clientId: northLondon._id, accountManagerId: alice._id, accountManagerName: alice.name,
    openCount: 3, clickCount: 1, isRead: true, bccTracked: true, attachments: [],
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  });

  const email2 = await Email.create({
    subject: 'Re: Q1 Pharmacy Review',
    direction: 'inbound', fromEmail: northLondon.email, fromName: 'Dr. Sarah Barnes',
    toEmail: alice.email, toName: alice.name,
    bodyPreview: 'Thank you for sending this over. We have reviewed the plan and have a few questions.',
    clientId: northLondon._id, accountManagerId: alice._id,
    openCount: 0, clickCount: 0, isRead: false, bccTracked: false, attachments: [],
    receivedAt: new Date(Date.now() - 45 * 60 * 1000),
  });

  const email3 = await Email.create({
    subject: 'Dispensing Report — February',
    direction: 'outbound', fromEmail: bob.email, fromName: bob.name,
    toEmail: meridian.email, toName: meridian.name,
    bodyPreview: 'Please find the February dispensing report for Meridian Health Group.',
    clientId: meridian._id, accountManagerId: bob._id, accountManagerName: bob.name,
    openCount: 1, clickCount: 0, isRead: true, bccTracked: true, attachments: [],
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });

  const email4 = await Email.create({
    subject: 'Urgent: Data Submission Deadline',
    direction: 'outbound', fromEmail: carol.email, fromName: carol.name,
    toEmail: eastMids.email, toName: eastMids.name,
    bodyPreview: 'This is a reminder that the data submission deadline for Q4 is approaching.',
    clientId: eastMids._id, accountManagerId: carol._id, accountManagerName: carol.name,
    openCount: 4, clickCount: 2, isRead: true, bccTracked: true, attachments: [],
    sentAt: new Date(Date.now() - 17 * 60 * 60 * 1000),
  });

  // ─── Timeline Entries ─────────────────────────────────────────────────────────
  await TimelineEntry.insertMany([
    {
      type: 'email_sent', clientId: northLondon._id, emailId: email1._id,
      subject: email1.subject, preview: email1.bodyPreview,
      fromName: alice.name, fromEmail: alice.email,
      accountManagerId: alice._id, accountManagerName: alice.name,
      isRead: true, openCount: 3, clickCount: 1, hasAttachments: false,
      occurredAt: email1.sentAt,
    },
    {
      type: 'email_received', clientId: northLondon._id, emailId: email2._id,
      subject: email2.subject, preview: email2.bodyPreview,
      fromName: 'Dr. Sarah Barnes', fromEmail: northLondon.email,
      accountManagerId: alice._id, accountManagerName: alice.name,
      isRead: false, openCount: 0, clickCount: 0, hasAttachments: false,
      occurredAt: email2.receivedAt,
    },
    {
      type: 'note', clientId: northLondon._id,
      content: 'Client mentioned they are considering expanding to a second surgery location. Follow up in April.',
      accountManagerId: alice._id, accountManagerName: alice.name,
      isRead: true, openCount: 0, clickCount: 0, hasAttachments: false,
      occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'email_sent', clientId: meridian._id, emailId: email3._id,
      subject: email3.subject, preview: email3.bodyPreview,
      fromName: bob.name, fromEmail: bob.email,
      accountManagerId: bob._id, accountManagerName: bob.name,
      isRead: true, openCount: 1, clickCount: 0, hasAttachments: false,
      occurredAt: email3.sentAt,
    },
    {
      type: 'email_sent', clientId: eastMids._id, emailId: email4._id,
      subject: email4.subject, preview: email4.bodyPreview,
      fromName: carol.name, fromEmail: carol.email,
      accountManagerId: carol._id, accountManagerName: carol.name,
      isRead: true, openCount: 4, clickCount: 2, hasAttachments: false,
      occurredAt: email4.sentAt,
    },
  ]);

  // ─── Notifications ────────────────────────────────────────────────────────────
  await Notification.insertMany([
    {
      type: 'email_received', isRead: false,
      title: 'New email from North London PCN',
      message: 'Re: Q1 Pharmacy Review — Dr. Sarah Barnes has replied.',
      clientId: northLondon._id, clientName: northLondon.name, emailId: email2._id,
    },
    {
      type: 'email_opened', isRead: false,
      title: 'Email opened by client',
      message: 'Q1 Pharmacy Review — opened 3 times by North London PCN.',
      clientId: northLondon._id, clientName: northLondon.name, emailId: email1._id,
    },
    {
      type: 'email_clicked', isRead: true,
      title: 'Link clicked in email',
      message: 'A link in "Dispensing Report — February" was clicked.',
      clientId: meridian._id, clientName: meridian.name, emailId: email3._id,
    },
    {
      type: 'sync_complete', isRead: true,
      title: 'Outlook sync complete',
      message: '3 new emails have been logged from your Outlook inbox.',
    },
  ]);

  console.log('✅ Seed complete! Sample NHS data loaded.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});