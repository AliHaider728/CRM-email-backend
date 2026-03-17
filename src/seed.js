import dotenv from 'dotenv';
dotenv.config();
import mongoose        from 'mongoose';
import Client          from './models/Client.js';
import TeamMember      from './models/TeamMember.js';
import Email           from './models/Email.js';
import EmailEngagement from './models/EmailEngagement.js';
import TimelineEntry   from './models/TimelineEntry.js';
import Notification    from './models/Notification.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🚀 Connected. Cleaning database...');

  await Promise.all([
    Client.deleteMany({}),
    TeamMember.deleteMany({}),
    Email.deleteMany({}),
    EmailEngagement.deleteMany({}),
    TimelineEntry.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  // ─── Team Members ──────────────────────────────────────────────────────────
  const [alice, bob, carol] = await TeamMember.insertMany([
    {
      name: 'Alice Johnson', email: 'alice@nhscrm.com',
      role: 'Senior Account Manager', avatarInitials: 'AJ',
      bccAddress: 'activity+alice@ourcrm.com',
      outlookConnected: true, emailCount: 142, sentCount: 90, receivedCount: 52, clientCount: 8,
    },
    {
      name: 'Bob Williams', email: 'bob@nhscrm.com',
      role: 'Account Manager', avatarInitials: 'BW',
      bccAddress: 'activity+bob@ourcrm.com',
      outlookConnected: true, emailCount: 64, sentCount: 45, receivedCount: 19, clientCount: 4,
    },
    {
      name: 'Carol Davis', email: 'carol@nhscrm.com',
      role: 'Junior Account Manager', avatarInitials: 'CD',
      bccAddress: 'activity+carol@ourcrm.com',
      outlookConnected: false, emailCount: 42, sentCount: 30, receivedCount: 12, clientCount: 3,
    },
  ]);

  // ─── Clients ───────────────────────────────────────────────────────────────
  const [northLondon, meridian, eastMids, southYorks] = await Client.insertMany([
    {
      name: 'North London PCN', pcnNumber: 'PCN-001', surgeryName: 'Highgate Surgery',
      email: 'contact@northlondonpcn.nhs.uk', phone: '+44 20 7946 0001',
      accountManagerId: alice._id, accountManagerName: alice.name,
      emailCount: 28, unreadCount: 3,
      lastContactedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      name: 'Meridian Health Group', pcnNumber: 'PCN-002', surgeryName: 'Meridian Medical Centre',
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
      emailCount: 45, unreadCount: 2,
      lastContactedAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  ]);

  // ─── Emails ────────────────────────────────────────────────────────────────
  const email1 = await Email.create({
    subject: 'Q1 Pharmacy Review — North London PCN',
    direction: 'outbound', fromEmail: alice.email, fromName: alice.name,
    toEmail: northLondon.email, toName: northLondon.name,
    body: "Hi Dr. Barnes,\n\nFollowing up on last week's review meeting, please find the action plan attached for your signature.\n\nBest regards,\nAlice",
    bodyPreview: "Following up on last week's review meeting, please find the action plan attached...",
    clientId: northLondon._id, clientName: northLondon.name,
    accountManagerId: alice._id, accountManagerName: alice.name,
    openCount: 5, uniqueOpenCount: 2, clickCount: 2, downloadCount: 0,
    lastOpenedAt: new Date(Date.now() - 30 * 60 * 1000),
    lastOpenedBy: 'dr.barnes@northlondonpcn.nhs.uk',
    isRead: true, syncMethod: 'bcc', bccTracked: true,
    sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  });

  const email2 = await Email.create({
    subject: 'Urgent: South Yorkshire Contract Renewal',
    direction: 'outbound', fromEmail: alice.email, fromName: alice.name,
    toEmail: southYorks.email, toName: southYorks.name,
    bodyPreview: 'Please review the updated terms for the 2026 contract cycle...',
    clientId: southYorks._id, clientName: southYorks.name,
    accountManagerId: alice._id, accountManagerName: alice.name,
    openCount: 12, uniqueOpenCount: 4, clickCount: 8, downloadCount: 3,
    lastOpenedAt: new Date(Date.now() - 5 * 60 * 1000),
    lastOpenedBy: 'manager@southyorkshire.nhs.uk',
    isRead: true, syncMethod: 'outlook_sync',
    sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  });

  const email3 = await Email.create({
    subject: 'Re: Dispensing Report February',
    direction: 'inbound', fromEmail: 'admin@meridianhealth.nhs.uk', fromName: 'Meridian Admin',
    toEmail: bob.email, toName: bob.name,
    bodyPreview: 'The report looks good, but we noticed a discrepancy in Section 4...',
    clientId: meridian._id, clientName: meridian.name,
    accountManagerId: bob._id, accountManagerName: bob.name,
    openCount: 0, clickCount: 0,
    isRead: false, syncMethod: 'outlook_sync',
    receivedAt: new Date(Date.now() - 15 * 60 * 1000),
  });

  // ─── Email Engagements (MOCK DATA FOR DRAWER) ──────────────────────────────
  await EmailEngagement.insertMany([
    // Engagements for Email 1 (Alice -> North London)
    {
      emailId: email1._id, type: 'open', 
      openedByEmail: 'dr.barnes@northlondonpcn.nhs.uk', openedByName: 'Dr. Sarah Barnes',
      device: 'mobile', os: 'iOS 17', browser: 'Safari', location: 'London, UK',
      occurredAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      emailId: email1._id, type: 'open', 
      openedByEmail: 'dr.barnes@northlondonpcn.nhs.uk', openedByName: 'Dr. Sarah Barnes',
      device: 'desktop', os: 'macOS', browser: 'Chrome', location: 'London, UK',
      occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      emailId: email1._id, type: 'click', 
      openedByEmail: 'dr.barnes@northlondonpcn.nhs.uk',
      device: 'desktop', linkUrl: 'https://nhs-portal.com/sign-contract-q1',
      occurredAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },

    // Engagements for Email 2 (Alice -> South Yorks) - LOTS OF ACTIVITY
    {
      emailId: email2._id, type: 'open', 
      openedByEmail: 'manager@southyorkshire.nhs.uk', openedByName: 'James Wilson',
      device: 'desktop', os: 'Windows 11', browser: 'Edge', location: 'Sheffield, UK',
      occurredAt: new Date(Date.now() - 50 * 60 * 1000)
    },
    {
      emailId: email2._id, type: 'click', 
      openedByEmail: 'manager@southyorkshire.nhs.uk',
      device: 'desktop', linkUrl: 'https://nhs-docs.com/contract-v2.pdf',
      occurredAt: new Date(Date.now() - 45 * 60 * 1000)
    },
    {
      emailId: email2._id, type: 'download', 
      openedByEmail: 'manager@southyorkshire.nhs.uk',
      device: 'desktop', fileName: 'contract-v2.pdf',
      occurredAt: new Date(Date.now() - 44 * 60 * 1000)
    },
    {
      emailId: email2._id, type: 'open', 
      openedByEmail: 'finance@southyorkshire.nhs.uk', openedByName: 'Finance Dept',
      device: 'tablet', os: 'iPadOS', browser: 'Safari', location: 'Doncaster, UK',
      occurredAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      emailId: email2._id, type: 'open', 
      openedByEmail: 'director@southyorkshire.nhs.uk', openedByName: 'Director',
      device: 'mobile', os: 'Android 14', browser: 'Chrome', location: 'Sheffield, UK',
      occurredAt: new Date(Date.now() - 5 * 60 * 1000)
    }
  ]);

  // ─── Timeline Entries ──────────────────────────────────────────────────────
  await TimelineEntry.insertMany([
    {
      type: 'email_sent', clientId: northLondon._id, emailId: email1._id,
      subject: email1.subject, preview: email1.bodyPreview,
      fromName: alice.name, fromEmail: alice.email,
      accountManagerId: alice._id, accountManagerName: alice.name,
      syncMethod: 'bcc', openCount: 5, clickCount: 2,
      occurredAt: email1.sentAt,
    },
    {
      type: 'email_sent', clientId: southYorks._id, emailId: email2._id,
      subject: email2.subject, preview: email2.bodyPreview,
      fromName: alice.name, fromEmail: alice.email,
      accountManagerId: alice._id, accountManagerName: alice.name,
      syncMethod: 'outlook_sync', openCount: 12, clickCount: 8,
      occurredAt: email2.sentAt,
    },
    {
      type: 'email_received', clientId: meridian._id, emailId: email3._id,
      subject: email3.subject, preview: email3.bodyPreview,
      fromName: 'Meridian Admin', fromEmail: 'admin@meridianhealth.nhs.uk',
      accountManagerId: bob._id, accountManagerName: bob.name,
      syncMethod: 'outlook_sync',
      occurredAt: email3.receivedAt,
    },
  ]);

  // ─── Notifications ─────────────────────────────────────────────────────────
  await Notification.insertMany([
    {
      type: 'email_opened', isRead: false,
      title: 'South Yorks Contract Opened',
      message: 'Email "Urgent: South Yorkshire Contract Renewal" was just opened for the 12th time.',
      clientId: southYorks._id, clientName: southYorks.name,
      emailId: email2._id, accountManagerName: alice.name,
      meta: { device: 'mobile', location: 'Sheffield, UK' }
    },
    {
      type: 'link_clicked', isRead: false,
      title: 'Link Clicked',
      message: 'James Wilson clicked the contract link in your South Yorks email.',
      clientId: southYorks._id, clientName: southYorks.name,
      emailId: email2._id, accountManagerName: alice.name,
      meta: { linkUrl: 'https://nhs-docs.com/contract-v2.pdf' }
    },
    {
      type: 'reply_received', isRead: false,
      title: 'New Reply',
      message: 'Meridian Admin replied to "Dispensing Report February"',
      clientId: meridian._id, clientName: meridian.name,
      emailId: email3._id, accountManagerName: bob.name
    }
  ]);

  console.log('✅ Seed complete with high-engagement mock data!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
}); 