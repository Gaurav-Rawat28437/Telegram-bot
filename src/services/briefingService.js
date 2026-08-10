const User =
  require("../models/User");

const {
  getQuote
} = require("./finnhubService");

const {
  getCompanyBySymbol
} = require(
  "../utils/companyResolver"
);

const {
  formatBriefingItem
} = require("../utils/formatter");

async function createUserBriefing(
  user
) {
  if (
    !user.watchlist ||
    user.watchlist.length === 0
  ) {
    return null;
  }

  const lines = [
    "🌙 Your Daily Finance Update",
    "",
    "Here is your personalized watchlist snapshot."
  ];

  for (
    const item of user.watchlist
  ) {
    try {
      const company =
        getCompanyBySymbol(
          item.symbol
        ) || {
          name: item.name,
          symbol: item.symbol
        };

      const quote =
        await getQuote(
          company.symbol
        );

      lines.push(
        "",
        formatBriefingItem(
          company,
          quote
        )
      );
    } catch (error) {
      console.error(
        `Briefing error for ${item.symbol}:`,
        error.message
      );

      lines.push(
        "",
        `⚠️ ${item.name} (${item.symbol}) data unavailable.`
      );
    }
  }

  lines.push(
    "",
    "🤖 UV-Atlas"
  );

  return lines.join("\n");
}

async function getUsersForBriefing() {
  return User.find({
    "watchlist.0": {
      $exists: true
    }
  });
}

module.exports = {
  createUserBriefing,
  getUsersForBriefing
};