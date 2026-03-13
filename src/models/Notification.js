const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type:       { type: String, enum: ['email_received', 'email_opened', 'email_clicked', 'sync_complete', 'system'], required: true },
    title:      { type: String, required: true },
    message:    { type: String, required: true },
    isRead:     { type: Boolean, default: false },
    clientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String },
    emailId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Email' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
