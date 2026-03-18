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
  console.log('Connected. Clearing data...');

  await Promise.all([
    Client.deleteMany({}),
    TeamMember.deleteMany({}),
    Email.deleteMany({}),
    EmailEngagement.deleteMany({}),
    TimelineEntry.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  //   Team Members   
  const [alice, bob, carol] = await TeamMember.insertMany([
    {
      name: 'Alice Johnson', email: 'alice@nhscrm.com',
      role: 'Senior Account Manager', avatarInitials: 'AJ',
      bccAddress: 'activity+alice@ourcrm.com',
      outlookConnected: true, emailCount: 87, sentCount: 60, receivedCount: 27, clientCount: 5,
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

  //   Clients    ──
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
      emailCount: 11, unreadCount: 2,
      lastContactedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ]);

  //   Emails     
  const email1 = await Email.create({
    subject: 'Q1 Pharmacy Review — North London PCN',
    direction: 'outbound', fromEmail: alice.email, fromName: alice.name,
    toEmail: northLondon.email, toName: northLondon.name,
    bodyPreview: "Following up on last week's review meeting, please find the action plan attached.",
    clientId: northLondon._id, accountManagerId: alice._id, accountManagerName: alice.name,
    openCount: 3, uniqueOpenCount: 2, clickCount: 1, downloadCount: 0,
    lastOpenedAt: new Date(Date.now() - 90 * 60 * 1000),
    lastOpenedBy: 'dr.barnes@northlondonpcn.nhs.uk',
    isRead: true, bccTracked: true, syncMethod: 'bcc', attachments: [],
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  });

  const email2 = await Email.create({
    subject: 'Re: Q1 Pharmacy Review',
    direction: 'inbound', fromEmail: northLondon.email, fromName: 'Dr. Sarah Barnes',
    toEmail: alice.email, toName: alice.name,
    bodyPreview: 'Thank you for sending this over. We have reviewed the plan and have a few questions.',
    clientId: northLondon._id, accountManagerId: alice._id, accountManagerName: alice.name,
    openCount: 0, clickCount: 0, downloadCount: 0,
    isRead: false, bccTracked: false, syncMethod: 'outlook_sync', attachments: [],
    receivedAt: new Date(Date.now() - 45 * 60 * 1000),
  });

  const email3 = await Email.create({
    subject: 'Dispensing Report — February',
    direction: 'outbound', fromEmail: bob.email, fromName: bob.name,
    toEmail: meridian.email, toName: meridian.name,
    bodyPreview: 'Please find the February dispensing report for Meridian Health Group.',
    clientId: meridian._id, accountManagerId: bob._id, accountManagerName: bob.name,
    openCount: 1, uniqueOpenCount: 1, clickCount: 0, downloadCount: 1,
    lastOpenedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    lastOpenedBy: 'admin@meridianhealth.nhs.uk',
    isRead: true, bccTracked: true, syncMethod: 'bcc', attachments: [],
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });

  const email4 = await Email.create({
    subject: 'Urgent: Data Submission Deadline',
    direction: 'outbound', fromEmail: carol.email, fromName: carol.name,
    toEmail: eastMids.email, toName: eastMids.name,
    bodyPreview: 'This is a reminder that the data submission deadline for Q4 is approaching.',
    clientId: eastMids._id, accountManagerId: carol._id, accountManagerName: carol.name,
    openCount: 4, uniqueOpenCount: 3, clickCount: 2, downloadCount: 0,
    lastOpenedAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
    lastOpenedBy: 'info@eastmidspgn.nhs.uk',
    isRead: true, bccTracked: true, syncMethod: 'bcc', attachments: [],
    sentAt: new Date(Date.now() - 17 * 60 * 60 * 1000),
  });

  //   Email Engagements (WHO opened / clicked) 
  await EmailEngagement.insertMany([
    // email1 — opened 3 times by 2 people
    {
      emailId: email1._id, clientId: northLondon._id, accountManagerId: alice._id,
      type: 'open', openedByEmail: 'dr.barnes@northlondonpcn.nhs.uk', openedByName: 'Dr. Sarah Barnes',
      device: 'mobile', os: 'iOS', browser: 'Safari',
      ipAddress: '85.115.52.1', location: 'London, UK',
      occurredAt: new Date(Date.now() - 90 * 60 * 1000),
    },
    {
      emailId: email1._id, clientId: northLondon._id, accountManagerId: alice._id,
      type: 'open', openedByEmail: 'dr.barnes@northlondonpcn.nhs.uk', openedByName: 'Dr. Sarah Barnes',
      device: 'desktop', os: 'Windows', browser: 'Chrome',
      ipAddress: '85.115.52.1', location: 'London, UK',
      occurredAt: new Date(Date.now() - 75 * 60 * 1000),
    },
    {
      emailId: email1._id, clientId: northLondon._id, accountManagerId: alice._id,
      type: 'open', openedByEmail: 'admin@northlondonpcn.nhs.uk', openedByName: 'PCN Admin',
      device: 'desktop', os: 'macOS', browser: 'Chrome',
      ipAddress: '85.115.52.2', location: 'London, UK',
      occurredAt: new Date(Date.now() - 60 * 60 * 1000),
    },
    // email1 — clicked once
    {
      emailId: email1._id, clientId: northLondon._id, accountManagerId: alice._id,
      type: 'click', openedByEmail: 'dr.barnes@northlondonpcn.nhs.uk',
      device: 'desktop', os: 'Windows', browser: 'Chrome',
      linkUrl: 'https://nhs.uk/pharmacy-review-q1', location: 'London, UK',
      occurredAt: new Date(Date.now() - 70 * 60 * 1000),
    },
    // email3 — opened + downloaded
    {
      emailId: email3._id, clientId: meridian._id, accountManagerId: bob._id,
      type: 'open', openedByEmail: 'admin@meridianhealth.nhs.uk', openedByName: 'Meridian Admin',
      device: 'desktop', os: 'Windows', browser: 'Edge',
      ipAddress: '92.40.11.5', location: 'Manchester, UK',
      occurredAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    },
    {
      emailId: email3._id, clientId: meridian._id, accountManagerId: bob._id,
      type: 'download', openedByEmail: 'admin@meridianhealth.nhs.uk',
      device: 'desktop', os: 'Windows', browser: 'Edge',
      fileName: 'February-Dispensing-Report.pdf', fileSize: 245000,
      location: 'Manchester, UK',
      occurredAt: new Date(Date.now() - 19 * 60 * 60 * 1000),
    },
    // email4 — 4 o pens, 2 clicks
    {
      emailId: email4._id, clientId: eastMids._id, accountManagerId: carol._id,
      type: 'open', openedByEmail: 'info@eastmidspgn.nhs.uk',
      device: 'mobile', os: 'Android', browser: 'Chrome',
      ipAddress: '78.32.99.1', location: 'Nottingham, UK',
      occurredAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
    },
    {
      emailId: email4._id, clientId: eastMids._id, accountManagerId: carol._id,
      type: 'open', openedByEmail: 'manager@eastmidspgn.nhs.uk',
      device: 'desktop', os: 'Windows', browser: 'Chrome',
      ipAddress: '78.32.99.2', location: 'Leicester, UK',
      occurredAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    },
    {
      emailId: email4._id, clientId: eastMids._id, accountManagerId: carol._id,
      type: 'click', openedByEmail: 'info@eastmidspgn.nhs.uk',
      device: 'mobile', os: 'Android', browser: 'Chrome',
      linkUrl: 'https://nhs.uk/data-submission-portal', location: 'Nottingham, UK',
      occurredAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
    },
    {
      emailId: email4._id, clientId: eastMids._id, accountManagerId: carol._id,
      type: 'click', openedByEmail: 'manager@eastmidspgn.nhs.uk',
      device: 'desktop', os: 'Windows', browser: 'Chrome',
      linkUrl: 'https://nhs.uk/q4-deadline', location: 'Leicester, UK',
      occurredAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
    },
  ]);

  //   Timeline Entries  
  await TimelineEntry.insertMany([
    {
      type: 'email_sent', clientId: northLondon._id, emailId: email1._id,
      subject: email1.subject, preview: email1.bodyPreview,
      fromName: alice.name, fromEmail: alice.email,
      accountManagerId: alice._id, accountManagerName: alice.name,
      syncMethod: 'bcc', isRead: true, openCount: 3, clickCount: 1,
      occurredAt: email1.sentAt,
    },
    {
      type: 'email_received', clientId: northLondon._id, emailId: email2._id,
      subject: email2.subject, preview: email2.bodyPreview,
      fromName: 'Dr. Sarah Barnes', fromEmail: northLondon.email,
      accountManagerId: alice._id, accountManagerName: alice.name,
      syncMethod: 'outlook_sync', isRead: false, openCount: 0, clickCount: 0,
      occurredAt: email2.receivedAt,
    },
    {
      type: 'note', clientId: northLondon._id,
      content: 'Client mentioned expanding to a second surgery. Follow up in April.',
      accountManagerId: alice._id, accountManagerName: alice.name,
      isRead: true, occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'email_sent', clientId: meridian._id, emailId: email3._id,
      subject: email3.subject, preview: email3.bodyPreview,
      fromName: bob.name, fromEmail: bob.email,
      accountManagerId: bob._id, accountManagerName: bob.name,
      syncMethod: 'bcc', isRead: true, openCount: 1, clickCount: 0,
      occurredAt: email3.sentAt,
    },
    {
      type: 'email_sent', clientId: eastMids._id, emailId: email4._id,
      subject: email4.subject, preview: email4.bodyPreview,
      fromName: carol.name, fromEmail: carol.email,
      accountManagerId: carol._id, accountManagerName: carol.name,
      syncMethod: 'bcc', isRead: true, openCount: 4, clickCount: 2,
      occurredAt: email4.sentAt,
    },
  ]);

  //   Notifications   
  await Notification.insertMany([
    {
      type: 'reply_received', isRead: false,
      title: 'Reply from North London PCN',
      message: 'Re: Q1 Pharmacy Review — Dr. Sarah Barnes replied.',
      clientId: northLondon._id, clientName: northLondon.name,
      emailId: email2._id, accountManagerName: alice.name,
    },
    {
      type: 'email_opened', isRead: false,
      title: 'Email opened',
      message: '"Q1 Pharmacy Review" opened by dr.barnes@northlondonpcn.nhs.uk on mobile (iOS/Safari)',
      clientId: northLondon._id, clientName: northLondon.name,
      emailId: email1._id, accountManagerName: alice.name,
      meta: { openedByEmail: 'dr.barnes@northlondonpcn.nhs.uk', device: 'mobile', os: 'iOS', browser: 'Safari', location: 'London, UK' },
    },
    {
      type: 'link_clicked', isRead: true,
      title: 'Link clicked in email',
      message: 'A link in "Q1 Pharmacy Review" was clicked by dr.barnes@northlondonpcn.nhs.uk',
      clientId: northLondon._id, clientName: northLondon.name,
      emailId: email1._id, accountManagerName: alice.name,
      meta: { openedByEmail: 'dr.barnes@northlondonpcn.nhs.uk', linkUrl: 'https://nhs.uk/pharmacy-review-q1', device: 'desktop' },
    },
    {
      type: 'file_downloaded', isRead: true,
      title: 'File downloaded',
      message: '"February-Dispensing-Report.pdf" downloaded by admin@meridianhealth.nhs.uk',
      clientId: meridian._id, clientName: meridian.name,
      emailId: email3._id, accountManagerName: bob.name,
      meta: { openedByEmail: 'admin@meridianhealth.nhs.uk', fileName: 'February-Dispensing-Report.pdf', device: 'desktop' },
    },
    {
      type: 'email_opened', isRead: true,
      title: 'Email opened',
      message: '"Urgent: Data Submission Deadline" opened 4 times by 2 recipients',
      clientId: eastMids._id, clientName: eastMids.name,
      emailId: email4._id, accountManagerName: carol.name,
    },
  ]);

  console.log('✅ Seed complete with full engagement tracking data!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});