const User =
  require("../models/User");

const {
  getQuote,
  getCompanyNews
} = require("./finnhubService");

const {
  money,
  signed,
  percent
} = require("../utils/formatter");

async function buildBriefing(
  user
) {
  if (
    !user.watchlist ||
    user.watchlist.length === 0
  ) {
    return `
🌅 Good morning, ${user.firstName || "there"}!

Your watchlist is currently empty.

Add companies naturally, for example:

"Add Tesla to my watchlist"
`.trim();
  }

  const lines = [
    `🌅 Good morning, ${user.firstName || "there"}!`,
    "",
    "📊 Your Watchlist Update",
    ""
  ];

  for (
    const company of user.watchlist
  ) {
    try {
      const quote =
        await getQuote(
          company.symbol
        );

      const direction =
        Number(quote.d) >= 0
          ? "🟢"
          : "🔴";

      lines.push(
        `${company.name} (${company.symbol})`,
        `💰 $${money(quote.c)}  ${direction} ${signed(quote.dp)}%`,
        `Day range: $${money(quote.l)} – $${money(quote.h)}`,
        ""
      );

    } catch (error) {
      lines.push(
        `${company.name} (${company.symbol})`,
        "⚠️ Live market data unavailable.",
        ""
      );
    }
  }

  lines.push(
    "📰 I'll continue monitoring your tracked companies."
  );

  return lines.join("\n");
}

async function sendBriefings(
  bot
) {
  const users =
    await User.find({
      "preferences.briefingEnabled": true
    });

  console.log(
    `Sending briefings to ${users.length} users...`
  );

  for (
    const user of users
  ) {
    try {
      const message =
        await buildBriefing(user);

      await bot.telegram.sendMessage(
        user.telegramId,
        message
      );

      console.log(
        "Briefing sent:",
        user.telegramId
      );

    } catch (error) {
      console.error(
        "Briefing error:",
        user.telegramId,
        error.message
      );
    }
  }
}

module.exports = {
  buildBriefing,
  sendBriefings
};