import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['email_sent', 'email_received', 'note', 'engagement'],
      required: true,
    },
    clientId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    emailId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Email' },
    subject:            { type: String },
    preview:            { type: String },
    content:            { type: String },   // for notes
    fromName:           { type: String },
    fromEmail:          { type: String },
    accountManagerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    accountManagerName: { type: String },
    syncMethod:         { type: String, enum: ['bcc', 'outlook_sync', 'manual'] },
    isRead:             { type: Boolean, default: false },
    openCount:          { type: Number, default: 0 },
    clickCount:         { type: Number, default: 0 },
    hasAttachments:     { type: Boolean, default: false },
    occurredAt:         { type: Date, required: true },
  },
  { timestamps: true }
);

timelineEntrySchema.index({ clientId: 1, occurredAt: -1 });

export default mongoose.model('TimelineEntry', timelineEntrySchema);