import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema(
  {
    // ─── Core fields ──────────────────────────────────────────────────────────
    subject:            { type: String, required: true },
    direction:          { type: String, enum: ['inbound', 'outbound'], required: true },
    fromEmail:          { type: String },
    fromName:           { type: String },
    toEmail:            { type: String },
    toName:             { type: String },
    body:               { type: String },
    bodyPreview:        { type: String },

    // ─── Relations ────────────────────────────────────────────────────────────
    clientId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    accountManagerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    accountManagerName: { type: String },

    // ─── Engagement counters (fast reads) ─────────────────────────────────────
    openCount:          { type: Number, default: 0 },
    clickCount:         { type: Number, default: 0 },
    downloadCount:      { type: Number, default: 0 },  // NEW
    uniqueOpenCount:    { type: Number, default: 0 },  // NEW — unique openers

    // ─── Last engagement snapshot (for list view) ─────────────────────────────
    lastOpenedAt:       { type: Date },                // NEW
    lastOpenedBy:       { type: String },              // NEW — email address
    lastClickedAt:      { type: Date },                // NEW

    // ─── Tracking metadata ────────────────────────────────────────────────────
    isRead:             { type: Boolean, default: false },
    bccTracked:         { type: Boolean, default: false },
    syncMethod:         { type: String, enum: ['bcc', 'outlook_sync', 'manual'], default: 'manual' }, // NEW
    outlookMessageId:   { type: String },
    attachments:        [String],

    // ─── Timestamps ───────────────────────────────────────────────────────────
    sentAt:             { type: Date },
    receivedAt:         { type: Date },
  },
  { timestamps: true }
);

emailSchema.index({ clientId: 1, createdAt: -1 });
emailSchema.index({ accountManagerId: 1 });
emailSchema.index({ direction: 1 });

export default mongoose.model('Email', emailSchema);