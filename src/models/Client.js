const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name:               { type: String, required: true },
    pcnNumber:          { type: String, required: true, unique: true },
    surgeryName:        { type: String },
    email:              { type: String },
    phone:              { type: String },
    accountManagerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    accountManagerName: { type: String },
    emailCount:         { type: Number, default: 0 },
    unreadCount:        { type: Number, default: 0 },
    lastContactedAt:    { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
