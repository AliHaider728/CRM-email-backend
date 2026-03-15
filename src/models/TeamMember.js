import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true },
    email:            { type: String, required: true, unique: true },
    role:             { type: String, default: 'Account Manager' },
    bccAddress:       { type: String },
    outlookConnected: { type: Boolean, default: false },
    avatarInitials:   { type: String },
    emailCount:       { type: Number, default: 0 },
    clientCount:      { type: Number, default: 0 },
    lastSyncAt:       { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('TeamMember', teamMemberSchema);