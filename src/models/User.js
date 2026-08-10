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
      unique: true,
      index: true
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
      default: ""
    },

    watchlist: {
      type: [watchlistSchema],
      default: []
    },

    pendingIntent: {
      type: String,
      default: null
    },

    pendingCompany: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);