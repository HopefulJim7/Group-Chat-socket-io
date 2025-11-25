const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    content: { type: String, required: true },

    // ✅ New fields for delivery and read receipts
    delivered: { type: Boolean, default: false },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);