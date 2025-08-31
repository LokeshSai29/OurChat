const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying of messages between users
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });

// Method to get message with populated sender info
messageSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    senderId: this.senderId,
    receiverId: this.receiverId,
    message: this.message,
    timestamp: this.timestamp,
    isRead: this.isRead,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Message', messageSchema);

