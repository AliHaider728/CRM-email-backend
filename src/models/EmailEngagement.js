import mongoose from 'mongoose';

const emailEngagementSchema = new mongoose.Schema(
  {
    emailId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Email',      required: true },
    clientId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    accountManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },

    type: { type: String, enum: ['open', 'click', 'download'], required: true },

    // WHO
    openedByEmail: { type: String },
    openedByName:  { type: String },

    // Device & location
    ipAddress: { type: String },
    userAgent:  { type: String },
    device:    { type: String, enum: ['mobile', 'desktop', 'tablet', 'unknown'], default: 'unknown' },
    os:        { type: String },
    browser:   { type: String },
    location:  { type: String },

    // Click / Download specifics
    linkUrl:  { type: String },
    fileName: { type: String },
    fileSize: { type: Number },

    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

emailEngagementSchema.index({ emailId: 1, occurredAt: -1 });
emailEngagementSchema.index({ clientId: 1, occurredAt: -1 });
emailEngagementSchema.index({ type: 1 });

export default mongoose.model('EmailEngagement', emailEngagementSchema);