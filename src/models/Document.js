const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      index: true
    },

    fileName: {
      type: String,
      required: true
    },

    fileType: {
      type: String,
      default: ""
    },

    extractedText: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Document",
  documentSchema
);