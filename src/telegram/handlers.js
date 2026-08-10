const User =
  require("../models/User");

const Conversation =
  require("../models/Conversation");

const {
  resolveCompany
} = require("../utils/companyResolver");

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
  isWatchlistRequest,
  isAddRequest,
  isRemoveRequest,
  isLivePriceRequest,
  isNewsRequest,
  isEarningsRequest,
  isSecRequest
} = require("../utils/intent");

const {
  getCompanyBySymbol
} = require("../services/companyService");

function extractCompanyText(
  text
) {
  return text
    .replace(
      /add|remove|delete|watchlist|watch list|to my watchlist|from my watchlist|please/gi,
      " "
    )
    .replace(
      /company|stock|shares/gi,
      " "
    )
    .trim();
}

function getCompanyFromMessage(
  text
) {
  return (
    resolveCompany(text) ||
    resolveCompany(
      extractCompanyText(text)
    )
  );
}

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
        ? [company]
        : []
    });
  } catch (error) {
    console.error(
      "Conversation save error:",
      error.message
    );
  }
}

async function addToWatchlist(
  user,
  company
) {
  const exists =
    user.watchlist.some(
      (item) =>
        item.symbol ===
        company.symbol
    );

  if (exists) {
    return {
      added: false,
      message:
        `${company.name} (${company.symbol}) is already in your watchlist.`
    };
  }

  user.watchlist.push({
    symbol: company.symbol,
    name: company.name
  });

  await user.save();

  return {
    added: true,
    message:
      `${company.name} (${company.symbol}) has been added to your watchlist.`
  };
}

async function removeFromWatchlist(
  user,
  company
) {
  const before =
    user.watchlist.length;

  user.watchlist =
    user.watchlist.filter(
      (item) =>
        item.symbol !==
        company.symbol
    );

  if (
    user.watchlist.length === before
  ) {
    return {
      removed: false,
      message:
        `${company.name} (${company.symbol}) isn't in your watchlist.`
    };
  }

  await user.save();

  return {
    removed: true,
    message:
      `${company.name} (${company.symbol}) has been removed from your watchlist.`
  };
}

function watchlistMessage(
  user
) {
  if (
    !user.watchlist ||
    user.watchlist.length === 0
  ) {
    return `
📊 Your Watchlist

Your watchlist is currently empty.

You can say:
"Add Tesla to my watchlist"
"Add Apple"
"Remove Tesla"
"What companies am I watching?"
`.trim();
  }

  const list =
    user.watchlist
      .map(
        (company, index) =>
          `${index + 1}. ${company.name} (${company.symbol})`
      )
      .join("\n");

  return `
📊 Your Watchlist

${list}

You can ask me for a live update, news, earnings, or SEC filings for any company.
`.trim();
}

async function handleLivePrice(
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

    await ctx.reply(answer);

    return answer;

  } catch (error) {
    console.error(
      "Live price error:",
      error.message
    );

    const answer =
      `⚠️ I couldn't retrieve live market data for ${company.name} (${company.symbol}) right now.`;

    await ctx.reply(answer);

    return answer;
  }
}

async function handleNews(
  ctx,
  company
) {
  try {
    const news =
      await getLatestNews(
        company.symbol
      );

    if (
      !news ||
      news.length === 0
    ) {
      const answer =
        `📰 I couldn't find recent news for ${company.name} (${company.symbol}).`;

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
          `${index + 1}. ${item.headline}`,
          item.summary
            ? item.summary.slice(
                0,
                250
              )
            : "",
          item.url
            ? item.url
            : ""
        );
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
      `⚠️ I couldn't retrieve recent news for ${company.name} right now.`;

    await ctx.reply(answer);

    return answer;
  }
}

async function handleEarnings(
  ctx,
  company
) {
  try {
    const data =
      await getEarnings(
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
          `📅 ${item.date || "N/A"}`,
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

async function handleSEC(
  ctx,
  company
) {
  if (!company.cik) {
    const answer =
      `⚠️ I don't have an SEC CIK mapping for ${company.name} yet.`;

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
        `No recent SEC filings were found for ${company.name}.`;

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
          `Accession: ${filing.accessionNumber}`
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
      `⚠️ I couldn't retrieve SEC filings for ${company.name} right now.`;

    await ctx.reply(answer);

    return answer;
  }
}

async function handleNaturalMessage(
  ctx,
  user,
  text
) {
  const telegramId =
    String(ctx.from.id);

  let company =
    getCompanyFromMessage(
      text
    );

  if (
    !company &&
    user.watchlist?.length
  ) {
    for (
      const item of user.watchlist
    ) {
      if (
        text
          .toLowerCase()
          .includes(
            item.name.toLowerCase()
          ) ||
        text
          .toUpperCase()
          .includes(
            item.symbol
          )
      ) {
        company =
          getCompanyBySymbol(
            item.symbol
          ) || item;

        break;
      }
    }
  }

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

  if (
    isAddRequest(text)
  ) {
    if (!company) {
      const answer =
        "Which company would you like me to add?";

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

  if (
    isRemoveRequest(text)
  ) {
    if (!company) {
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

  if (
    isLivePriceRequest(text) &&
    company
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

  if (
    isNewsRequest(text) &&
    company
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

  if (
    isEarningsRequest(text) &&
    company
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

  if (
    isSecRequest(text) &&
    company
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

  let context = "";

  if (company) {
    try {
      const [
        quote,
        profile
      ] = await Promise.all([
        getQuote(
          company.symbol
        ),
        getCompanyProfile(
          company.symbol
        )
      ]);

      context = JSON.stringify({
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

  const result =
    await askAI({
      telegramId,
      user,
      question: text,
      context
    });

  if (
    !result.success
  ) {
    if (result.quota) {
      const answer =
        `⚠️ The AI service has temporarily reached its usage limit.\n\nI can still handle watchlists and live market-data requests while it resets.`;

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

    return;
  }

  await ctx.reply(
    result.text
  );

  await saveConversation(
    telegramId,
    text,
    result.text,
    company
  );
}

module.exports = {
  handleNaturalMessage,
  watchlistMessage
};