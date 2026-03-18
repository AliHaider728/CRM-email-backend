import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema(
  {
    // ─── Core ──────────────────────────────────────────────────────────────────
    subject:     { type: String, required: true },
    direction:   { type: String, enum: ['inbound', 'outbound'], required: true },
    fromEmail:   { type: String },
    fromName:    { type: String },
    toEmail:     { type: String },
    toName:      { type: String },
    body:        { type: String },
    bodyPreview: { type: String },

    // ─── Relations ─────────────────────────────────────────────────────────────
    clientId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    accountManagerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    accountManagerName: { type: String },

    // ─── Engagement counters ───────────────────────────────────────────────────
    openCount:       { type: Number, default: 0 },
    uniqueOpenCount: { type: Number, default: 0 },
    clickCount:      { type: Number, default: 0 },
    downloadCount:   { type: Number, default: 0 },

    // ─── Last engagement snapshot ──────────────────────────────────────────────
    lastOpenedAt: { type: Date },
    lastOpenedBy: { type: String },
    lastClickedAt: { type: Date },

    // ─── Metadata ─────────────────────────────────────────────────────────────
    isRead:           { type: Boolean, default: false },
    bccTracked:       { type: Boolean, default: false },
    syncMethod:       { type: String, enum: ['bcc', 'outlook_sync', 'manual'], default: 'manual' },
    outlookMessageId: { type: String },
    attachments:      [String],

    // ─── Timestamps ───────────────────────────────────────────────────────────
    sentAt:     { type: Date },
    receivedAt: { type: Date },
  },
  { timestamps: true }
);

emailSchema.index({ clientId: 1, createdAt: -1 });
emailSchema.index({ accountManagerId: 1 });
emailSchema.index({ direction: 1 });
emailSchema.index({ outlookMessageId: 1 }, { sparse: true });  // prevent duplicate sync

export default mongoose.model('Email', emailSchema);