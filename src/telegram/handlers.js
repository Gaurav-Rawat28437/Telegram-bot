
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
  isCompanyOnlyMessage
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
   CASUAL MESSAGE
========================================================= */

function isCasualMessage(text) {
  const value = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ");

  return (
    value === "hello" ||
    value === "hi" ||
    value === "hey" ||
    value === "how are you" ||
    value === "how are you doing" ||
    value === "how are things" ||
    value === "good morning" ||
    value === "good afternoon" ||
    value === "good evening" ||
    value === "thanks" ||
    value === "thank you" ||
    value === "thank you so much"
  );
}


function getCasualResponse(text) {
  const value = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ");

  if (
    value === "hello" ||
    value === "hi" ||
    value === "hey" ||
    value === "good morning" ||
    value === "good afternoon" ||
    value === "good evening"
  ) {
    return [
      "Hello! 👋 I'm Atlas AI, your financial assistant.",
      "",
      "Try:",
      "• Track Tesla",
      "• What's Tesla's price?",
      "• Show my watchlist",
      "• My watchlist live finance",
      "• Latest news about Apple"
    ].join("\n");
  }

  if (
    value === "how are you" ||
    value === "how are you doing" ||
    value === "how are things"
  ) {
    return "I'm doing great! 🚀 I'm ready to help with your finance and stock queries.";
  }

  if (
    value === "thanks" ||
    value === "thank you" ||
    value === "thank you so much"
  ) {
    return "You're welcome! 😊 I'm here whenever you need financial information.";
  }

  return "Hello! 👋 How can I help you with the market today?";
}


/* =========================================================
   CONVERSATION
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
   SHOW WATCHLIST
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
                finnhubSymbol: item.symbol
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
   NATURAL MESSAGE
========================================================= */

async function handleNaturalMessage(
  ctx,
  user,
  text
) {
  const telegramId =
    String(ctx.from.id);

  /* =======================================================
     CASUAL MESSAGE
  ======================================================= */

  if (
    isCasualMessage(text)
  ) {
    const answer =
      getCasualResponse(text);

    await ctx.reply(answer);

    await saveConversation(
      telegramId,
      text,
      answer
    );

    return;
  }


  /* =======================================================
     PENDING COMPANY FOLLOW-UP

     Example:

     User: its live finance
     Bot: Which company?
     User: apple

     User: live tesla
     -> does NOT come here because company
        is already in the same message.
  ======================================================= */

  if (
    user.pendingIntent &&
    isCompanyOnlyMessage(text)
  ) {
    const company =
      await getCompanyBySymbol(
        String(text)
          .toUpperCase()
          .trim()
      );

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

      return;
    }

    const pendingIntent =
      user.pendingIntent;

    user.pendingIntent = null;
    user.pendingCompany = null;

    await user.save();


    /* LIVE PRICE */

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

      return;
    }


    /* NEWS */

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

      return;
    }


    /* EARNINGS */

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

      return;
    }


    /* SEC */

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

      return;
    }


    /* ADD / TRACK */

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

      return;
    }


    /* REMOVE */

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

      return;
    }
  }


  /* =======================================================
     NORMAL COMPANY RESOLUTION
  ======================================================= */

  let company =
    getCompanyFromMessage(text);


  /* =======================================================
     CHECK WATCHLIST FOR COMPANY
  ======================================================= */

  if (
    !company &&
    user.watchlist?.length
  ) {
    const lower =
      String(text)
        .toLowerCase();

    for (
      const item of user.watchlist
    ) {
      if (
        lower.includes(
          String(
            item.name
          ).toLowerCase()
        ) ||
        lower.includes(
          String(
            item.symbol
          ).toLowerCase()
        )
      ) {
        company =
          (await getCompanyBySymbol(
            item.symbol
          )) || {
            name: item.name,
            symbol: item.symbol,
            finnhubSymbol: item.symbol
          };

        break;
      }
    }
  }


  /* =======================================================
     1. WATCHLIST LIVE FINANCE
  ======================================================= */

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


  /* =======================================================
     2. SHOW WATCHLIST
  ======================================================= */

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


  /* =======================================================
     3. ADD / TRACK
  ======================================================= */

  if (
    isAddRequest(text)
  ) {
    if (!company) {
      user.pendingIntent =
        "add_watchlist";

      user.pendingCompany =
        null;

      await user.save();

      const answer =
        "Which company would you like to track?";

      await ctx.reply(answer);

      return;
    }

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


  /* =======================================================
     4. REMOVE
  ======================================================= */

  if (
    isRemoveRequest(text)
  ) {
    if (!company) {
      user.pendingIntent =
        "remove_watchlist";

      user.pendingCompany =
        null;

      await user.save();

      const answer =
        "Which company would you like me to remove from your watchlist?";

      await ctx.reply(answer);

      return;
    }

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


  /* =======================================================
     5. SINGLE COMPANY LIVE PRICE
  ======================================================= */

  if (
    isLivePriceRequest(text)
  ) {
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


  /* =======================================================
     6. NEWS
  ======================================================= */

  if (
    isNewsRequest(text)
  ) {
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


  /* =======================================================
     7. EARNINGS
  ======================================================= */

  if (
    isEarningsRequest(text)
  ) {
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


  /* =======================================================
     8. SEC
  ======================================================= */

  if (
    isSecRequest(text)
  ) {
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


  /* =======================================================
     9. AI CONTEXT
  ======================================================= */

  let context = "";

  if (company) {
    try {
      const [
        quote,
        profile
      ] = await Promise.all([
        getQuote(
          company.finnhubSymbol ||
          company.symbol
        ),

        getCompanyProfile(
          company.finnhubSymbol ||
          company.symbol
        )
      ]);

      context =
        JSON.stringify({
          company,
          quote,
          profile
        });
    } catch (error) {
      console.error(
        "Finance context error:",
        error.message
      );
    }
  }


  /* =======================================================
     10. GEMINI / NORMAL CONVERSATION
  ======================================================= */

  try {
    const result =
      await askAI({
        telegramId,
        user,
        question: text,
        context
      });


    /* =====================================================
       AI ERROR
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
          "• Track Tesla",
          "• My watchlist",
          "• My watchlist live finance",
          "• Live finance for a company",
          "• Company news",
          "• Earnings",
          "• SEC filings"
        ].join("\n");

        await ctx.reply(answer);

        await saveConversation(
          telegramId,
          text,
          answer,
          company
        );

        return;
      }

      const answer =
        "⚠️ I couldn't process that request right now. Please try again.";

      await ctx.reply(answer);

      await saveConversation(
        telegramId,
        text,
        answer,
        company
      );

      return;
    }


    /* =====================================================
       AI SUCCESS
    ===================================================== */

    const answer =
      result.text ||
      "I'm ready to help. What would you like to know?";

    await ctx.reply(answer);

    await saveConversation(
      telegramId,
      text,
      answer,
      company
    );

  } catch (error) {
    console.error(
      "AI handler error:",
      error.message
    );

    const answer =
      "⚠️ I couldn't process that request right now. Please try again.";

    await ctx.reply(answer);

    await saveConversation(
      telegramId,
      text,
      answer,
      company
    );
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
  removeFromWatchlist,
  isCasualMessage
};
