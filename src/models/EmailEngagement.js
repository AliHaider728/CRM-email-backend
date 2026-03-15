import mongoose from 'mongoose';

const emailEngagementSchema = new mongoose.Schema(
  {
    // ─── Relations ────────────────────────────────────────────────────────────
    emailId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Email',      required: true },
    clientId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Client'      },
    accountManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember'  },

    // ─── Event type ───────────────────────────────────────────────────────────
    type: {
      type:     String,
      enum:     ['open', 'click', 'download'],
      required: true,
    },

    // ─── WHO did it ───────────────────────────────────────────────────────────
    openedByEmail: { type: String },   // recipient email address
    openedByName:  { type: String },   // if known from contacts

    // ─── Device & location ────────────────────────────────────────────────────
    ipAddress:  { type: String },
    userAgent:  { type: String },
    device:     { type: String, enum: ['mobile', 'desktop', 'tablet', 'unknown'], default: 'unknown' },
    os:         { type: String },      // e.g. "iOS 17", "Windows 11"
    browser:    { type: String },      // e.g. "Chrome 120"
    location:   { type: String },      // e.g. "London, UK"

    // ─── Click / Download specifics ───────────────────────────────────────────
    linkUrl:    { type: String },      // for click events — which URL was clicked
    fileName:   { type: String },      // for download events — which file
    fileSize:   { type: Number },      // bytes

    // ─── Timestamp ────────────────────────────────────────────────────────────
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for fast lookups
emailEngagementSchema.index({ emailId: 1, occurredAt: -1 });
emailEngagementSchema.index({ clientId: 1, occurredAt: -1 });
emailEngagementSchema.index({ type: 1 });

export default mongoose.model('EmailEngagement', emailEngagementSchema);