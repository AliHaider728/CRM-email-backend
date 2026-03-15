import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema(
  {
    subject:            { type: String, required: true },
    direction:          { type: String, enum: ['inbound', 'outbound'], required: true },
    fromEmail:          { type: String },
    fromName:           { type: String },
    toEmail:            { type: String },
    toName:             { type: String },
    body:               { type: String },
    bodyPreview:        { type: String },
    clientId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    accountManagerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    accountManagerName: { type: String },
    openCount:          { type: Number, default: 0 },
    clickCount:         { type: Number, default: 0 },
    isRead:             { type: Boolean, default: false },
    bccTracked:         { type: Boolean, default: false },
    outlookMessageId:   { type: String },
    attachments:        [String],
    sentAt:             { type: Date },
    receivedAt:         { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Email', emailSchema);