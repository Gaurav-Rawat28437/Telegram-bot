const User =
  require("../models/User");

const Conversation =
  require("../models/Conversation");

const {
  resolveCompany
} = require("../utils/companyResolver");

const {
  getQuote
} = require("../services/finnhubService");

const {
  formatQuote,
  formatWatchlistQuote
} = require("../utils/formatter");

const {
  isWatchlistRequest,
  isWatchlistLiveFinanceRequest,
  isAddRequest,
  isRemoveRequest,
  isLivePriceRequest,
  isNewsRequest,
  isEarningsRequest,
  isSecRequest
} = require("../utils/intent");


/*
|--------------------------------------------------------------------------
| SAVE CONVERSATION
|--------------------------------------------------------------------------
*/

async function saveConversation(
  telegramId,
  question,
  answer,
  company = null
) {
  try {
    await Conversation.create({
      telegramId,
      question,
      answer,

      companies: company
        ? [
            {
              name: company.name,
              symbol: company.symbol
            }
          ]
        : []
    });
  } catch (error) {
    console.error(
      "Conversation save error:",
      error.message
    );
  }
}


/*
|--------------------------------------------------------------------------
| RESOLVE COMPANY
|--------------------------------------------------------------------------
*/

function getCompanyFromMessage(
  text
) {
  return resolveCompany(text);
}


/*
|--------------------------------------------------------------------------
| WATCHLIST MESSAGE
|--------------------------------------------------------------------------
*/

function watchlistMessage(user) {
  const watchlist =
    user.watchlist || [];

  if (
    watchlist.length === 0
  ) {
    return [
      "📊 Your Watchlist",
      "",
      "Your watchlist is currently empty.",
      "",
      "Try:",
      "• Add Tesla to my watchlist",
      "• Add Apple",
      "• Add NVIDIA",
      "• What companies am I watching?"
    ].join("\n");
  }

  const companies =
    watchlist
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} (${item.symbol})`
      )
      .join("\n");

  return [
    "📊 Your Watchlist",
    "",
    companies,
    "",
    "You can also ask:",
    "• My watchlist live finance",
    "• Latest news about Tesla",
    "• Tesla earnings"
  ].join("\n");
}


/*
|--------------------------------------------------------------------------
| ADD WATCHLIST
|--------------------------------------------------------------------------
*/

async function addToWatchlist(
  user,
  company
) {
  if (!user.watchlist) {
    user.watchlist = [];
  }

  const exists =
    user.watchlist.some(
      (item) =>
        item.symbol.toUpperCase() ===
        company.symbol.toUpperCase()
    );

  if (exists) {
    return {
      success: false,
      message:
        `📌 ${company.name} (${company.symbol}) is already in your watchlist.`
    };
  }

  user.watchlist.push({
    name: company.name,
    symbol: company.symbol
  });

  await user.save();

  return {
    success: true,
    message:
      `✅ ${company.name} (${company.symbol}) has been added to your watchlist.`
  };
}


/*
|--------------------------------------------------------------------------
| REMOVE WATCHLIST
|--------------------------------------------------------------------------
*/

async function removeFromWatchlist(
  user,
  company
) {
  if (!user.watchlist) {
    user.watchlist = [];
  }

  const oldLength =
    user.watchlist.length;

  user.watchlist =
    user.watchlist.filter(
      (item) =>
        item.symbol.toUpperCase() !==
        company.symbol.toUpperCase()
    );

  if (
    oldLength ===
    user.watchlist.length
  ) {
    return {
      success: false,
      message:
        `📌 ${company.name} (${company.symbol}) is not in your watchlist.`
    };
  }

  await user.save();

  return {
    success: true,
    message:
      `✅ ${company.name} (${company.symbol}) has been removed from your watchlist.`
  };
}


/*
|--------------------------------------------------------------------------
| ONE COMPANY LIVE FINANCE
|--------------------------------------------------------------------------
*/

async function sendCompanyLiveFinance(
  ctx,
  company
) {
  try {
    const quote =
      await getQuote(
        company.symbol
      );

    const answer =
      formatQuote(
        company,
        quote
      );

    await ctx.reply(
      answer
    );

    return answer;
  } catch (error) {
    console.error(
      `Live finance error for ${company.symbol}:`,
      error.message
    );

    const answer =
      `⚠️ Live finance data for ${company.name} (${company.symbol}) is currently unavailable.`;

    await ctx.reply(
      answer
    );

    return answer;
  }
}


/*
|--------------------------------------------------------------------------
| ENTIRE WATCHLIST LIVE FINANCE
|--------------------------------------------------------------------------
*/

async function sendWatchlistLiveFinance(
  ctx,
  user
) {
  const watchlist =
    user.watchlist || [];

  if (
    watchlist.length === 0
  ) {
    const answer =
      [
        "📊 Your Watchlist",
        "",
        "Your watchlist is currently empty.",
        "",
        "Add a company first:",
        "• Add Tesla to my watchlist",
        "• Add Apple to my watchlist"
      ].join("\n");

    await ctx.reply(
      answer
    );

    return answer;
  }

  const lines = [
    "📊 Your Watchlist — Live Finance",
    "",
    "🔴 Live market snapshot",
    ""
  ];

  for (
    const item of watchlist
  ) {
    try {
      const company = {
        name: item.name,
        symbol: item.symbol
      };

      const quote =
        await getQuote(
          item.symbol
        );

      lines.push(
        formatWatchlistQuote(
          company,
          quote
        ),
        ""
      );
    } catch (error) {
      console.error(
        `Watchlist live finance error for ${item.symbol}:`,
        error.message
      );

      lines.push(
        `⚠️ ${item.name} (${item.symbol}) — data unavailable`,
        ""
      );
    }
  }

  lines.push(
    "🕐 Live market data fetched just now."
  );

  const answer =
    lines.join("\n");

  await ctx.reply(
    answer
  );

  return answer;
}


/*
|--------------------------------------------------------------------------
| MAIN HANDLER
|--------------------------------------------------------------------------
*/

async function handleNaturalMessage(
  ctx,
  user,
  text
) {
  const telegramId =
    String(ctx.from.id);

  const cleanText =
    String(text || "").trim();

  /*
  |--------------------------------------------------------------------------
  | 1. MY WATCHLIST LIVE FINANCE
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | "my watchlist live finance"
  |
  | This MUST run before normal watchlist.
  |
  */

  if (
    isWatchlistLiveFinanceRequest(
      cleanText
    )
  ) {
    user.pendingIntent =
      "live_finance";

    await user.save();

    const answer =
      await sendWatchlistLiveFinance(
        ctx,
        user
      );

    await saveConversation(
      telegramId,
      cleanText,
      answer
    );

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | 2. NORMAL WATCHLIST
  |--------------------------------------------------------------------------
  */

  if (
    isWatchlistRequest(
      cleanText
    )
  ) {
    user.pendingIntent = "";

    await user.save();

    const answer =
      watchlistMessage(
        user
      );

    await ctx.reply(
      answer
    );

    await saveConversation(
      telegramId,
      cleanText,
      answer
    );

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | 3. ADD COMPANY
  |--------------------------------------------------------------------------
  */

  if (
    isAddRequest(
      cleanText
    )
  ) {
    const company =
      getCompanyFromMessage(
        cleanText
      );

    if (!company) {
      const answer =
        "Which company would you like me to add to your watchlist?";

      await ctx.reply(
        answer
      );

      return;
    }

    user.pendingIntent = "";

    const result =
      await addToWatchlist(
        user,
        company
      );

    await ctx.reply(
      result.message
    );

    await saveConversation(
      telegramId,
      cleanText,
      result.message,
      company
    );

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | 4. REMOVE COMPANY
  |--------------------------------------------------------------------------
  */

  if (
    isRemoveRequest(
      cleanText
    )
  ) {
    const company =
      getCompanyFromMessage(
        cleanText
      );

    if (!company) {
      const answer =
        "Which company would you like me to remove from your watchlist?";

      await ctx.reply(
        answer
      );

      return;
    }

    user.pendingIntent = "";

    const result =
      await removeFromWatchlist(
        user,
        company
      );

    await ctx.reply(
      result.message
    );

    await saveConversation(
      telegramId,
      cleanText,
      result.message,
      company
    );

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | 5. LIVE FINANCE
  |--------------------------------------------------------------------------
  |
  | Examples:
  |
  | "tesla live finance"
  | "what's Tesla's price now?"
  | "its live finance"
  |
  */

  if (
    isLivePriceRequest(
      cleanText
    )
  ) {
    const company =
      getCompanyFromMessage(
        cleanText
      );

    if (!company) {
      /*
       * Remember the user's request.
       *
       * Next message:
       *
       * "tesla"
       *
       * will be treated as live finance.
       */

      user.pendingIntent =
        "live_finance";

      await user.save();

      const answer =
        "Which company would you like a live finance update for?";

      await ctx.reply(
        answer
      );

      return;
    }

    user.pendingIntent = "";

    await user.save();

    const answer =
      await sendCompanyLiveFinance(
        ctx,
        company
      );

    await saveConversation(
      telegramId,
      cleanText,
      answer,
      company
    );

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | 6. FOLLOW-UP COMPANY
  |--------------------------------------------------------------------------
  |
  | This fixes:
  |
  | User: its live finance
  | Bot: Which company?
  | User: tesla
  |
  | Tesla is now interpreted according
  | to pendingIntent.
  |
  */

  if (
    user.pendingIntent ===
    "live_finance"
  ) {
    const company =
      getCompanyFromMessage(
        cleanText
      );

    if (company) {
      user.pendingIntent = "";

      await user.save();

      const answer =
        await sendCompanyLiveFinance(
          ctx,
          company
        );

      await saveConversation(
        telegramId,
        cleanText,
        answer,
        company
      );

      return;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | 7. NEWS
  |--------------------------------------------------------------------------
  */

  if (
    isNewsRequest(
      cleanText
    )
  ) {
    const company =
      getCompanyFromMessage(
        cleanText
      );

    if (!company) {
      const answer =
        "Which company would you like the latest news for?";

      await ctx.reply(
        answer
      );

      return;
    }

    user.pendingIntent = "";

    await user.save();

    try {
      const {
        getCompanyNews
      } =
        require(
          "../services/finnhubService"
        );

      const today =
        new Date();

      const previous =
        new Date();

      previous.setDate(
        previous.getDate() - 7
      );

      const from =
        previous
          .toISOString()
          .split("T")[0];

      const to =
        today
          .toISOString()
          .split("T")[0];

      const news =
        await getCompanyNews(
          company.symbol,
          from,
          to
        );

      if (
        !news ||
        news.length === 0
      ) {
        const answer =
          `📰 No recent news found for ${company.name} (${company.symbol}).`;

        await ctx.reply(
          answer
        );

        return;
      }

      const topNews =
        news.slice(0, 5);

      const lines = [
        `📰 Latest News — ${company.name} (${company.symbol})`,
        ""
      ];

      topNews.forEach(
        (item, index) => {
          lines.push(
            `${index + 1}. ${item.headline || "Untitled"}`,
            item.url || "",
            ""
          );
        }
      );

      const answer =
        lines.join("\n");

      await ctx.reply(
        answer
      );

      await saveConversation(
        telegramId,
        cleanText,
        answer,
        company
      );

      return;
    } catch (error) {
      console.error(
        "News error:",
        error.message
      );

      await ctx.reply(
        "⚠️ I couldn't retrieve the latest news right now."
      );

      return;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | 8. EARNINGS
  |--------------------------------------------------------------------------
  */

  if (
    isEarningsRequest(
      cleanText
    )
  ) {
    const company =
      getCompanyFromMessage(
        cleanText
      );

    if (!company) {
      await ctx.reply(
        "Which company's earnings would you like to see?"
      );

      return;
    }

    user.pendingIntent = "";

    await user.save();

    try {
      const {
        getEarnings
      } =
        require(
          "../services/finnhubService"
        );

      const data =
        await getEarnings(
          company.symbol
        );

      const earnings =
        data?.earningsCalendar || [];

      if (
        earnings.length === 0
      ) {
        await ctx.reply(
          `📊 No earnings information found for ${company.name}.`
        );

        return;
      }

      const lines = [
        `📊 Earnings — ${company.name} (${company.symbol})`,
        ""
      ];

      earnings
        .slice(0, 5)
        .forEach(
          (item) => {
            lines.push(
              `📅 Date: ${item.date || "N/A"}`,
              `EPS Actual: ${item.epsActual ?? "N/A"}`,
              `EPS Estimate: ${item.epsEstimate ?? "N/A"}`,
              `Revenue Actual: ${item.revenueActual ?? "N/A"}`,
              `Revenue Estimate: ${item.revenueEstimate ?? "N/A"}`,
              ""
            );
          }
        );

      const answer =
        lines.join("\n");

      await ctx.reply(
        answer
      );

      await saveConversation(
        telegramId,
        cleanText,
        answer,
        company
      );

      return;
    } catch (error) {
      console.error(
        "Earnings error:",
        error.message
      );

      await ctx.reply(
        "⚠️ I couldn't retrieve earnings information right now."
      );

      return;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | 9. SEC
  |--------------------------------------------------------------------------
  */

  if (
    isSecRequest(
      cleanText
    )
  ) {
    const company =
      getCompanyFromMessage(
        cleanText
      );

    if (!company) {
      await ctx.reply(
        "Which company's SEC filings would you like to see?"
      );

      return;
    }

    user.pendingIntent = "";

    await user.save();

    await ctx.reply(
      `📄 SEC filing support for ${company.name} (${company.symbol}) is available when the company's SEC CIK is configured.`
    );

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | 10. COMPANY ONLY
  |--------------------------------------------------------------------------
  |
  | If the user previously asked:
  |
  | "its live finance"
  |
  | this was handled above.
  |
  | Otherwise don't send a bare company name
  | directly to Gemini.
  |
  */

  const company =
    getCompanyFromMessage(
      cleanText
    );

  if (company) {
    const answer =
      [
        `📊 ${company.name} (${company.symbol})`,
        "",
        "What would you like to know?",
        "",
        `• ${company.name} live finance`,
        `• Latest news about ${company.name}`,
        `• ${company.name} earnings`,
        `• Add ${company.name} to my watchlist`
      ].join("\n");

    await ctx.reply(
      answer
    );

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | 11. UNKNOWN REQUEST
  |--------------------------------------------------------------------------
  */

  await ctx.reply(
    [
      "I can help with your finances.",
      "",
      "Try:",
      "• Add Tesla to my watchlist",
      "• What companies am I watching?",
      "• My watchlist live finance",
      "• What's Tesla's live price?",
      "• Latest news about Tesla",
      "• Tesla earnings"
    ].join("\n")
  );
}


module.exports = {
  handleNaturalMessage,
  watchlistMessage,
  sendWatchlistLiveFinance,
  sendCompanyLiveFinance
};