
const User =
  require("../models/User");

const Conversation =
  require("../models/Conversation");

const {
  resolveCompany
} = require("../utils/companyResolver");

const {
  getCompanyBySymbol
} = require("../services/companyService");

const {
  getQuote,
  getCompanyProfile,
  getEarnings
} = require("../services/finnhubService");

const {
  getLatestNews
} = require("../services/newsService");

const {
  getCompanySubmissions,
  getRecentFilings
} = require("../services/secService");

const {
  formatQuote
} = require("../utils/formatter");

const {
  askAI
} = require("../services/aiService");

const {
  isWatchlistLiveFinanceRequest,
  isWatchlistRequest,
  isAddRequest,
  isRemoveRequest,
  isLivePriceRequest,
  isNewsRequest,
  isEarningsRequest,
  isSecRequest,
  isCompanyOnlyMessage,
  isComparisonRequest
} = require("../utils/intent");


/* =========================================================
   COMPANY EXTRACTION
   ========================================================= */

function extractCompanyText(text) {
  return String(text || "")
    .replace(
      /\b(add|track|watch|remove|delete|unwatch|watchlist|watch\s+list|to my watchlist|from my watchlist|please)\b/gi,
      " "
    )
    .replace(
      /\b(company|stock|stocks|shares|price|prices|live|finance|financial|update|updates)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}


function getCompanyFromMessage(text) {
  const direct =
    resolveCompany(text);

  if (direct) {
    return direct;
  }

  const cleaned =
    extractCompanyText(text);

  if (!cleaned) {
    return null;
  }

  return resolveCompany(cleaned);
}


/* =========================================================
   SAVE CONVERSATION
   ========================================================= */

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


/* =========================================================
   ADD TO WATCHLIST
   ========================================================= */

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
        String(item.symbol)
          .toUpperCase() ===
        String(company.symbol)
          .toUpperCase()
    );

  if (exists) {
    return {
      added: false,
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
    added: true,
    message:
      `✅ ${company.name} (${company.symbol}) has been added to your watchlist.`
  };
}


/* =========================================================
   REMOVE FROM WATCHLIST
   ========================================================= */

async function removeFromWatchlist(
  user,
  company
) {
  if (!user.watchlist) {
    user.watchlist = [];
  }

  const before =
    user.watchlist.length;

  user.watchlist =
    user.watchlist.filter(
      (item) =>
        String(item.symbol)
          .toUpperCase() !==
        String(company.symbol)
          .toUpperCase()
    );

  if (
    user.watchlist.length ===
    before
  ) {
    return {
      removed: false,
      message:
        `📌 ${company.name} (${company.symbol}) isn't currently in your watchlist.`
    };
  }

  await user.save();

  return {
    removed: true,
    message:
      `✅ ${company.name} (${company.symbol}) has been removed from your watchlist.`
  };
}


/* =========================================================
   WATCHLIST MESSAGE
   ========================================================= */

function watchlistMessage(user) {
  const list =
    user.watchlist || [];

  if (list.length === 0) {
    return [
      "📊 Your Watchlist",
      "",
      "Your watchlist is currently empty.",
      "",
      "Try:",
      "• Track Tesla",
      "• Track Apple",
      "• Track NVIDIA",
      "• What companies am I watching?",
      "• My watchlist live finance"
    ].join("\n");
  }

  const companies =
    list
      .map(
        (company, index) =>
          `${index + 1}. ${company.name} (${company.symbol})`
      )
      .join("\n");

  return [
    "📊 Your Watchlist",
    "",
    companies,
    "",
    "You can ask:",
    "• What's Tesla's price now?",
    "• Latest news about Apple",
    "• Tesla earnings",
    "• Show Tesla SEC filings",
    "• My watchlist live finance"
  ].join("\n");
}


/* =========================================================
   WATCHLIST LIVE FINANCE
   ========================================================= */

async function handleWatchlistLiveFinance(
  ctx,
  user
) {
  const list =
    user.watchlist || [];

  if (list.length === 0) {
    const answer = [
      "📊 Your Watchlist",
      "",
      "Your watchlist is currently empty.",
      "",
      "Add a company first:",
      "• Track Tesla",
      "• Track Apple",
      "• Track NVIDIA"
    ].join("\n");

    await ctx.reply(answer);

    return answer;
  }

  const results =
    await Promise.all(
      list.map(
        async (item) => {
          try {
            const company =
              await getCompanyBySymbol(
                item.symbol
              );

            const resolvedCompany =
              company || {
                name: item.name,
                symbol: item.symbol,
                finnhubSymbol:
                  item.symbol
              };

            const quote =
              await getQuote(
                resolvedCompany.finnhubSymbol ||
                  resolvedCompany.symbol
              );

            return {
              success: true,
              company:
                resolvedCompany,
              quote
            };
          } catch (error) {
            console.error(
              `Watchlist finance error for ${item.symbol}:`,
              error.message
            );

            return {
              success: false,
              company: {
                name: item.name,
                symbol: item.symbol
              },
              error:
                error.message
            };
          }
        }
      )
    );

  const lines = [
    "📊 Live Finance — Your Watchlist",
    ""
  ];

  let successCount = 0;

  for (
    const result of results
  ) {
    const company =
      result.company;

    if (!result.success) {
      lines.push(
        `⚠️ ${company.name} (${company.symbol})`,
        "Live data is currently unavailable.",
        ""
      );

      continue;
    }

    successCount++;

    const quote =
      result.quote || {};

    const price =
      Number(quote.c || 0);

    const change =
      Number(quote.d || 0);

    const changePercent =
      Number(quote.dp || 0);

    const high =
      Number(quote.h || 0);

    const low =
      Number(quote.l || 0);

    const open =
      Number(quote.o || 0);

    const previousClose =
      Number(quote.pc || 0);

    const icon =
      change >= 0
        ? "🟢"
        : "🔴";

    const sign =
      change >= 0
        ? "+"
        : "";

    lines.push(
      `📈 ${company.name} (${company.symbol})`,
      `💰 Price: $${price.toFixed(2)}`,
      `${icon} Change: ${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`,
      `📈 High: $${high.toFixed(2)}`,
      `📉 Low: $${low.toFixed(2)}`,
      `🔓 Open: $${open.toFixed(2)}`,
      `🔒 Previous Close: $${previousClose.toFixed(2)}`,
      ""
    );
  }

  lines.push(
    "🕐 Live data fetched just now.",
    `📊 ${successCount}/${list.length} companies updated.`
  );

  const answer =
    lines.join("\n");

  await ctx.reply(answer);

  return answer;
}


/* =========================================================
   SINGLE COMPANY LIVE FINANCE
   ========================================================= */

async function handleLivePrice(
  ctx,
  company
) {
  try {
    const quote =
      await getQuote(
        company.finnhubSymbol ||
          company.symbol
      );

    const answer =
      formatQuote(
        company,
        quote
      );

    await ctx.reply(answer);

    return answer;
  } catch (error) {
    console.error(
      "Live price error:",
      error.message
    );

    const answer =
      `⚠️ Live market data for ${company.name} (${company.symbol}) is temporarily unavailable.`;

    await ctx.reply(answer);

    return answer;
  }
}


/* =========================================================
   NEWS
   ========================================================= */

async function handleNews(
  ctx,
  company
) {
  try {
    const news =
      await getLatestNews(
        company.finnhubSymbol ||
          company.symbol
      );

    if (
      !news ||
      news.length === 0
    ) {
      const answer =
        `📰 No recent news was found for ${company.name} (${company.symbol}).`;

      await ctx.reply(answer);

      return answer;
    }

    const latest =
      news.slice(0, 5);

    const lines = [
      `📰 ${company.name} (${company.symbol})`,
      "",
      "Latest developments:"
    ];

    latest.forEach(
      (item, index) => {
        lines.push(
          "",
          `${index + 1}. ${item.headline || "Untitled"}`
        );

        if (item.summary) {
          lines.push(
            item.summary.slice(
              0,
              250
            )
          );
        }

        if (item.url) {
          lines.push(
            item.url
          );
        }
      }
    );

    const answer =
      lines.join("\n");

    await ctx.reply(answer);

    return answer;
  } catch (error) {
    console.error(
      "News error:",
      error.message
    );

    const answer =
      `⚠️ I couldn't retrieve recent news for ${company.name}.`;

    await ctx.reply(answer);

    return answer;
  }
}


/* =========================================================
   EARNINGS
   ========================================================= */

async function handleEarnings(
  ctx,
  company
) {
  try {
    const data =
      await getEarnings(
        company.finnhubSymbol ||
          company.symbol
      );

    const earnings =
      data?.earningsCalendar || [];

    const relevant =
      earnings.slice(0, 3);

    if (
      relevant.length === 0
    ) {
      const answer =
        `📊 No recent earnings information was returned for ${company.name} (${company.symbol}).`;

      await ctx.reply(answer);

      return answer;
    }

    const lines = [
      `📊 ${company.name} (${company.symbol})`,
      "",
      "Recent / upcoming earnings:"
    ];

    relevant.forEach(
      (item) => {
        lines.push(
          "",
          `📅 Date: ${item.date || "N/A"}`,
          `EPS actual: ${item.epsActual ?? "N/A"}`,
          `EPS estimate: ${item.epsEstimate ?? "N/A"}`,
          `Revenue actual: ${item.revenueActual ?? "N/A"}`,
          `Revenue estimate: ${item.revenueEstimate ?? "N/A"}`
        );
      }
    );

    const answer =
      lines.join("\n");

    await ctx.reply(answer);

    return answer;
  } catch (error) {
    console.error(
      "Earnings error:",
      error.message
    );

    const answer =
      `⚠️ I couldn't retrieve earnings information for ${company.name}.`;

    await ctx.reply(answer);

    return answer;
  }
}


/* =========================================================
   SEC
   ========================================================= */

async function handleSEC(
  ctx,
  company
) {
  if (!company.cik) {
    const answer =
      `⚠️ SEC CIK information isn't configured for ${company.name} yet.`;

    await ctx.reply(answer);

    return answer;
  }

  try {
    const data =
      await getCompanySubmissions(
        company.cik
      );

    const filings =
      getRecentFilings(
        data,
        5
      );

    if (
      filings.length === 0
    ) {
      const answer =
        `📄 No recent SEC filings were found for ${company.name}.`;

      await ctx.reply(answer);

      return answer;
    }

    const lines = [
      `📄 ${company.name} (${company.symbol})`,
      "",
      "Recent SEC filings:"
    ];

    filings.forEach(
      (filing, index) => {
        lines.push(
          "",
          `${index + 1}. ${filing.form}`,
          `Date: ${filing.filingDate}`,
          `Accession: ${filing.accessionNumber}`,
          `Document: ${filing.primaryDocument}`
        );
      }
    );

    const answer =
      lines.join("\n");

    await ctx.reply(answer);

    return answer;
  } catch (error) {
    console.error(
      "SEC error:",
      error.message
    );

    const answer =
      `⚠️ I couldn't retrieve SEC filings for ${company.name}.`;

    await ctx.reply(answer);

    return answer;
  }
}


/* =========================================================
   HANDLE PENDING COMPANY
   ========================================================= */

async function handlePendingCompany(
  ctx,
  user,
  text,
  telegramId
) {
  if (
    !user.pendingIntent
  ) {
    return false;
  }

  /*
   * Only treat the message as a company
   * if it is a company-only message.
   */
  if (
    !isCompanyOnlyMessage(text)
  ) {
    return false;
  }

  const pendingIntent =
    user.pendingIntent;

  const company =
    getCompanyFromMessage(text);

  if (!company) {
    const answer =
      `⚠️ I couldn't find ${text} as a supported company.`;

    await ctx.reply(answer);

    user.pendingIntent = null;
    user.pendingCompany = null;

    await user.save();

    await saveConversation(
      telegramId,
      text,
      answer
    );

    return true;
  }

  /*
   * Clear pending state first.
   */
  user.pendingIntent = null;
  user.pendingCompany = null;

  /*
   * IMPORTANT:
   * Remember this company.
   *
   * This allows:
   *
   * Tesla live finance
   * Track this
   *
   * to work naturally.
   */
  user.lastCompany = {
    name: company.name,
    symbol: company.symbol
  };

  await user.save();


  /* =====================================================
     ADD WATCHLIST
     ===================================================== */

  if (
    pendingIntent ===
    "add_watchlist"
  ) {
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
      text,
      result.message,
      company
    );

    return true;
  }


  /* =====================================================
     REMOVE WATCHLIST
     ===================================================== */

  if (
    pendingIntent ===
    "remove_watchlist"
  ) {
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
      text,
      result.message,
      company
    );

    return true;
  }


  /* =====================================================
     LIVE PRICE
     ===================================================== */

  if (
    pendingIntent ===
    "live_price"
  ) {
    const answer =
      await handleLivePrice(
        ctx,
        company
      );

    await saveConversation(
      telegramId,
      text,
      answer,
      company
    );

    return true;
  }


  /* =====================================================
     NEWS
     ===================================================== */

  if (
    pendingIntent ===
    "news"
  ) {
    const answer =
      await handleNews(
        ctx,
        company
      );

    await saveConversation(
      telegramId,
      text,
      answer,
      company
    );

    return true;
  }


  /* =====================================================
     EARNINGS
     ===================================================== */

  if (
    pendingIntent ===
    "earnings"
  ) {
    const answer =
      await handleEarnings(
        ctx,
        company
      );

    await saveConversation(
      telegramId,
      text,
      answer,
      company
    );

    return true;
  }


  /* =====================================================
     SEC
     ===================================================== */

  if (
    pendingIntent ===
    "sec"
  ) {
    const answer =
      await handleSEC(
        ctx,
        company
      );

    await saveConversation(
      telegramId,
      text,
      answer,
      company
    );

    return true;
  }

  return false;
}


/* =========================================================
   GET LAST COMPANY
   ========================================================= */

async function getLastCompany(
  user
) {
  if (
    !user.lastCompany ||
    !user.lastCompany.symbol
  ) {
    return null;
  }

  return (
    await getCompanyBySymbol(
      user.lastCompany.symbol
    )
  ) || {
    name:
      user.lastCompany.name,
    symbol:
      user.lastCompany.symbol,
    finnhubSymbol:
      user.lastCompany.symbol
  };
}


/* =========================================================
   NATURAL MESSAGE
   ========================================================= */

async function handleNaturalMessage(
  ctx,
  user,
  text
) {
  const telegramId =
    String(ctx.from.id);

  try {

    /* =====================================================
       0. PENDING COMPANY FOLLOW-UP
       ===================================================== */

    const handledPending =
      await handlePendingCompany(
        ctx,
        user,
        text,
        telegramId
      );

    if (handledPending) {
      return;
    }


    /* =====================================================
       1. GET COMPANY FROM CURRENT MESSAGE
       ===================================================== */

    let company =
      getCompanyFromMessage(text);


    /* =====================================================
       2. WATCHLIST LIVE FINANCE
       ===================================================== */

    if (
      isWatchlistLiveFinanceRequest(
        text
      )
    ) {
      const answer =
        await handleWatchlistLiveFinance(
          ctx,
          user
        );

      await saveConversation(
        telegramId,
        text,
        answer
      );

      return;
    }


    /* =====================================================
       3. SHOW WATCHLIST
       ===================================================== */

    if (
      isWatchlistRequest(text)
    ) {
      const answer =
        watchlistMessage(user);

      await ctx.reply(answer);

      await saveConversation(
        telegramId,
        text,
        answer
      );

      return;
    }


    /* =====================================================
       4. ADD / TRACK / WATCH
       ===================================================== */

    if (
      isAddRequest(text)
    ) {

      /*
       * "track this"
       *
       * If we already know the last company,
       * use it automatically.
       */

      const normalized =
        String(text || "")
          .toLowerCase()
          .trim();

      if (
        normalized ===
          "track this" ||
        normalized ===
          "watch this" ||
        normalized ===
          "add this" ||
        normalized ===
          "track it" ||
        normalized ===
          "watch it" ||
        normalized ===
          "add it"
      ) {
        const lastCompany =
          await getLastCompany(
            user
          );

        if (lastCompany) {
          company =
            lastCompany;
        }
      }


      if (!company) {
        const answer =
          "Which company would you like to track?";

        await ctx.reply(answer);

        user.pendingIntent =
          "add_watchlist";

        user.pendingCompany =
          null;

        await user.save();

        return;
      }


      /*
       * Remember company.
       */

      user.lastCompany = {
        name: company.name,
        symbol: company.symbol
      };

      await user.save();


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
        text,
        result.message,
        company
      );

      return;
    }


    /* =====================================================
       5. REMOVE COMPANY
       ===================================================== */

    if (
      isRemoveRequest(text)
    ) {

      if (!company) {
        const answer =
          "Which company would you like to remove from your watchlist?";

        await ctx.reply(answer);

        user.pendingIntent =
          "remove_watchlist";

        user.pendingCompany =
          null;

        await user.save();

        return;
      }


      user.lastCompany = {
        name: company.name,
        symbol: company.symbol
      };

      await user.save();


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
        text,
        result.message,
        company
      );

      return;
    }


    /* =====================================================
       6. LIVE PRICE
       ===================================================== */

    if (
      isLivePriceRequest(text)
    ) {

      /*
       * Support:
       *
       * apple live
       * live apple
       * tesla price
       * tesla live finance
       */

      if (!company) {

        /*
         * If user says:
         *
         * "live"
         *
         * after talking about Tesla,
         * use last company.
         */

        const normalized =
          String(text || "")
            .toLowerCase()
            .trim();

        if (
          normalized === "live" ||
          normalized ===
            "live finance" ||
          normalized ===
            "current price"
        ) {
          company =
            await getLastCompany(
              user
            );
        }
      }


      if (!company) {
        user.pendingIntent =
          "live_price";

        user.pendingCompany =
          null;

        await user.save();

        const answer =
          "Which company would you like a live finance update for?";

        await ctx.reply(answer);

        return;
      }


      user.lastCompany = {
        name: company.name,
        symbol: company.symbol
      };

      await user.save();


      const answer =
        await handleLivePrice(
          ctx,
          company
        );

      await saveConversation(
        telegramId,
        text,
        answer,
        company
      );

      return;
    }


    /* =====================================================
       7. NEWS
       ===================================================== */

    if (
      isNewsRequest(text)
    ) {

      if (!company) {
        company =
          await getLastCompany(
            user
          );
      }


      if (!company) {
        user.pendingIntent =
          "news";

        user.pendingCompany =
          null;

        await user.save();

        const answer =
          "Which company would you like the latest news for?";

        await ctx.reply(answer);

        return;
      }


      user.lastCompany = {
        name: company.name,
        symbol: company.symbol
      };

      await user.save();


      const answer =
        await handleNews(
          ctx,
          company
        );

      await saveConversation(
        telegramId,
        text,
        answer,
        company
      );

      return;
    }


    /* =====================================================
       8. EARNINGS
       ===================================================== */

    if (
      isEarningsRequest(text)
    ) {

      if (!company) {
        company =
          await getLastCompany(
            user
          );
      }


      if (!company) {
        user.pendingIntent =
          "earnings";

        user.pendingCompany =
          null;

        await user.save();

        const answer =
          "Which company's earnings would you like to see?";

        await ctx.reply(answer);

        return;
      }


      user.lastCompany = {
        name: company.name,
        symbol: company.symbol
      };

      await user.save();


      const answer =
        await handleEarnings(
          ctx,
          company
        );

      await saveConversation(
        telegramId,
        text,
        answer,
        company
      );

      return;
    }


    /* =====================================================
       9. SEC
       ===================================================== */

    if (
      isSecRequest(text)
    ) {

      if (!company) {
        company =
          await getLastCompany(
            user
          );
      }


      if (!company) {
        user.pendingIntent =
          "sec";

        user.pendingCompany =
          null;

        await user.save();

        const answer =
          "Which company's SEC filings would you like to see?";

        await ctx.reply(answer);

        return;
      }


      user.lastCompany = {
        name: company.name,
        symbol: company.symbol
      };

      await user.save();


      const answer =
        await handleSEC(
          ctx,
          company
        );

      await saveConversation(
        telegramId,
        text,
        answer,
        company
      );

      return;
    }


    /* =====================================================
       10. COMPANY COMPARISON
       ===================================================== */

    if (
      typeof isComparisonRequest ===
        "function" &&
      isComparisonRequest(text)
    ) {

      /*
       * Comparisons are normal AI questions.
       *
       * Example:
       *
       * Apple vs Samsung
       * Tesla vs Toyota
       *
       * These go to Gemini.
       */

      const result =
        await askAI({
          telegramId,
          user,
          question: text,
          context: ""
        });

      if (
        !result ||
        !result.success
      ) {
        if (
          result?.quota
        ) {
          const answer = [
            "⚠️ The AI service has temporarily reached its usage limit.",
            "",
            "You can still use:",
            "• Track a company",
            "• Live finance",
            "• Watchlist",
            "• Company news",
            "• Earnings",
            "• SEC filings"
          ].join("\n");

          await ctx.reply(answer);

          await saveConversation(
            telegramId,
            text,
            answer
          );

          return;
        }

        const answer =
          "⚠️ I couldn't process that request right now. Please try again.";

        await ctx.reply(answer);

        await saveConversation(
          telegramId,
          text,
          answer
        );

        return;
      }

      await ctx.reply(
        result.text
      );

      await saveConversation(
        telegramId,
        text,
        result.text
      );

      return;
    }


    /* =====================================================
       11. NORMAL CONVERSATION → GEMINI
       ===================================================== */

    /*
     * Everything that is not a specific
     * finance operation goes to Gemini.
     *
     * Examples:
     *
     * hello
     * hi
     * how are you
     * how are u
     * apple vs samsung
     * what is a stock
     * what is market cap
     * explain investing
     * thank you
     */

    const result =
      await askAI({
        telegramId,
        user,
        question: text,
        context: ""
      });


    /* =====================================================
       12. GEMINI ERROR
       ===================================================== */

    if (
      !result ||
      !result.success
    ) {

      if (
        result?.quota
      ) {
        const answer = [
          "⚠️ The AI service has temporarily reached its usage limit.",
          "",
          "You can still use:",
          "• Track a company",
          "• Live finance",
          "• Watchlist",
          "• Company news",
          "• Earnings",
          "• SEC filings"
        ].join("\n");

        await ctx.reply(answer);

        await saveConversation(
          telegramId,
          text,
          answer
        );

        return;
      }


      console.error(
        "AI request failed:",
        result?.error
      );

      const answer =
        "⚠️ I couldn't process that request right now. Please try again.";

      await ctx.reply(answer);

      await saveConversation(
        telegramId,
        text,
        answer
      );

      return;
    }


    /* =====================================================
       13. GEMINI SUCCESS
       ===================================================== */

    await ctx.reply(
      result.text
    );

    await saveConversation(
      telegramId,
      text,
      result.text
    );

  } catch (error) {

    console.error(
      "handleNaturalMessage error:",
      error
    );

    const answer =
      "⚠️ Something went wrong while processing your request. Please try again.";

    try {
      await ctx.reply(answer);

      await saveConversation(
        telegramId,
        text,
        answer
      );
    } catch (replyError) {
      console.error(
        "Telegram reply error:",
        replyError.message
      );
    }
  }
}


/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  handleNaturalMessage,
  watchlistMessage,
  handleWatchlistLiveFinance,
  addToWatchlist,
  removeFromWatchlist
};

