const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true
    },

    username: {
      type: String,
      default: ""
    },

    firstName: {
      type: String,
      default: ""
    },

    role: {
      type: String,
      enum: [
        "student",
        "investor",
        "trader",
        "analyst",
        "founder",
        "finance professional",
        "other"
      ],
      default: null
    },

    watchlist: {
      type: [watchlistSchema],
      default: []
    },

    preferences: {
      briefingEnabled: {
        type: Boolean,
        default: true
      },

      briefingHour: {
        type: Number,
        default: 8
      },

      briefingMinute: {
        type: Number,
        default: 0
      },

      timezone: {
        type: String,
        default: "Asia/Kolkata"
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "User",
  userSchema
);