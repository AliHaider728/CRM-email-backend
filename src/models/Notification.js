import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // FIX: added all missing enum values used in seed.js
    type: {
      type: String,
      enum: [
        'email_received',   // inbound email arrived
        'email_opened',     // recipient opened a sent email
        'email_clicked',    // recipient clicked a link  (was 'link_clicked' in seed — aliased below)
        'link_clicked',     // alias kept for backward compat
        'file_downloaded',  // recipient downloaded an attachment
        'reply_received',   // client replied
        'sync_complete',    // Outlook sync finished
        'system',           // generic system message
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false },

    // ─── Relations ─────────────────────────────────────────────────────────────
    clientId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName:         { type: String },                       // FIX: was missing
    emailId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Email' },
    accountManagerName: { type: String },                       // FIX: was missing

    // ─── Extra metadata (open/click device info etc.) ──────────────────────────
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },   // FIX: was missing
  },
  { timestamps: true }
);

notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ clientId: 1 });

export default mongoose.model('Notification', notificationSchema);