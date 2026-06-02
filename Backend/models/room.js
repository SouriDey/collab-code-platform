const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      default: "Untitled Room",
    },

    type: {
      type: String,
      default: "coding",
      enum: ["coding", "interview"],
    },

    language: {
      type: String,
      default: "javascript",
    },

    code: {
      type: String,
      default: "// Start coding here...",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);;