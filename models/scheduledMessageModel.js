
const mongoose = require("mongoose");

const scheduledMessageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    delivered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ScheduledMessage = mongoose.model("ScheduledMessage", scheduledMessageSchema);

module.exports = ScheduledMessage;
