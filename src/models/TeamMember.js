import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true },
    email:            { type: String, required: true, unique: true },
    role:             { type: String, default: 'Account Manager' },
    avatarInitials:   { type: String },

    // ─── BCC & Outlook  
    bccAddress:            { type: String },
    outlookConnected:      { type: Boolean, default: false },
    outlookRefreshToken:   { type: String },    // stored after OAuth flow
    lastSyncAt:            { type: Date },

    // ─── Counters — FIX: added sentCount + receivedCount (used in seed)  
    emailCount:    { type: Number, default: 0 },
    sentCount:     { type: Number, default: 0 },   // FIX: was missing
    receivedCount: { type: Number, default: 0 },   // FIX: was missing
    clientCount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('TeamMember', teamMemberSchema);