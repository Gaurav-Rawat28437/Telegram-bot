const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      index: true
    },

    question: {
      type: String,
      required: true
    },

    answer: {
      type: String,
      required: true
    },

    companies: {
      type: [
        {
          symbol: String,
          name: String
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);