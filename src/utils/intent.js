function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ");
}

/* =========================================================
WATCHLIST
========================================================= */

function isWatchlistRequest(text) {
  const value = normalize(text);

  return (
    value === "watchlist" ||
    value === "watch list" ||
    value === "watching" ||
    value === "my watchlist" ||
    value === "my watch list" ||
    value === "show watchlist" ||
    value === "show my watchlist" ||
    value === "show watch list" ||
    value === "show my watch list" ||
    value.includes("what companies am i watching") ||
    value.includes("which companies am i watching") ||
    value.includes("companies am i watching") ||
    value.includes("what am i watching")
  );
}

/* =========================================================
ADD / TRACK / WATCH
========================================================= */

function isAddRequest(text) {
  const value = normalize(text);

  const action =
    /\badd\b/.test(value) ||
    /\btrack\b/.test(value) ||
    /\bwatch\b/.test(value);

  if (!action) {
    return false;
  }

  return (
    value.includes("watchlist") ||
    value.includes("watch list") ||
    value.includes("my watchlist") ||
    value.includes("my watch list") ||
    value.startsWith("add ") ||
    value.startsWith("track ") ||
    value.startsWith("watch ")
  );
}

/* =========================================================
REMOVE FROM WATCHLIST
========================================================= */

function isRemoveRequest(text) {
  const value = normalize(text);

  const action =
    /\bremove\b/.test(value) ||
    /\bdelete\b/.test(value) ||
    /\bunwatch\b/.test(value);

  if (!action) {
    return false;
  }

  return (
    value.includes("watchlist") ||
    value.includes("watch list") ||
    value.includes("my watchlist") ||
    value.includes("my watch list") ||
    value.length <= 40
  );
}

/* =========================================================
LIVE FINANCE / INDIVIDUAL COMPANY PRICE
========================================================= */

function isLivePriceRequest(text) {
  const value = normalize(text);

  /* -------------------------------------------------------
  Explicit live finance phrases
  ------------------------------------------------------- */

  if (
    value.includes("live finance") ||
    value.includes("live financial") ||
    value.includes("live price") ||
    value.includes("live prices") ||
    value.includes("live stock") ||
    value.includes("live stock price") ||
    value.includes("current price") ||
    value.includes("current stock price") ||
    value.includes("stock price") ||
    value.includes("price now") ||
    value.includes("price today") ||
    value.includes("share price") ||
    value.includes("shares price") ||
    value.includes("trading at") ||
    value.includes("market price") ||
    value.includes("market update") ||
    value.includes("finance update") ||
    value.includes("financial update") ||
    value === "live" ||
    value === "its live finance" ||
    value === "it's live finance"
  ) {
    return true;
  }

  /* -------------------------------------------------------
  Natural language price questions

  Examples:
  Tesla price
  Tesla current price
  Tesla stock price
  What is Tesla price
  What's Tesla price
  What about Tesla price
  How much is Tesla
  ------------------------------------------------------- */

  if (/\bprice\b/.test(value)) {
    return true;
  }

  if (/\bhow much is\b/.test(value)) {
    return true;
  }

  if (
    /\bwhat is\b.*\b(price|stock|shares)\b/.test(value)
  ) {
    return true;
  }

  if (
    /\bwhat's\b.*\b(price|stock|shares)\b/.test(value)
  ) {
    return true;
  }

  if (
    /\bwhat about\b.*\b(price|stock|shares)\b/.test(value)
  ) {
    return true;
  }

  /* -------------------------------------------------------
  IMPORTANT:
  Handle:

  apple live
  live apple
  tesla live
  live tesla
  nvidia live
  microsoft live
  ------------------------------------------------------- */

  if (
    /\blive\b/.test(value)
  ) {
    return true;
  }

  return false;
}

/* =========================================================
WATCHLIST LIVE FINANCE
========================================================= */

function isWatchlistLiveFinanceRequest(text) {
  const value = normalize(text);

  const watchlist =
    value.includes("watchlist") ||
    value.includes("watch list") ||
    value.includes("my watchlist") ||
    value.includes("my watch list");

  const live =
    value.includes("live finance") ||
    value.includes("live financial") ||
    value.includes("live price") ||
    value.includes("live prices") ||
    value.includes("live stock") ||
    value.includes("current price") ||
    value.includes("current prices") ||
    value.includes("market update") ||
    value.includes("finance update") ||
    value.includes("financial update");

  return watchlist && live;
}

/* =========================================================
NEWS
========================================================= */

function isNewsRequest(text) {
  const value = normalize(text);

  return (
    value.includes("latest news") ||
    value.includes("latest company news") ||
    value.includes("recent news") ||
    value.includes("recent company news") ||
    value.includes("company news") ||
    value.includes("news about") ||
    value.includes("news on") ||
    value.includes("news for") ||
    value.includes("what's the news") ||
    value.includes("whats the news") ||
    value.startsWith("news ")
  );
}

/* =========================================================
EARNINGS
========================================================= */

function isEarningsRequest(text) {
  const value = normalize(text);

  return (
    value.includes("earnings") ||
    value.includes("earnings report") ||
    value.includes("earnings date") ||
    value.includes("quarterly earnings") ||
    value.includes("earnings results") ||
    value.includes("financial results")
  );
}

/* =========================================================
SEC
========================================================= */

function isSecRequest(text) {
  const value = normalize(text);

  return (
    value.includes("sec filing") ||
    value.includes("sec filings") ||
    value.includes("sec report") ||
    value.includes("10-k") ||
    value.includes("10q") ||
    value.includes("10-q") ||
    value.includes("filing") ||
    value.includes("filings")
  );
}

/* =========================================================
COMPANY ONLY MESSAGE
========================================================= */

function isCompanyOnlyMessage(text) {
  const value = normalize(text);

  if (!value) {
    return false;
  }

  const companyWords = [
    "tesla",
    "tsla",

    "apple",
    "aapl",

    "microsoft",
    "msft",

    "nvidia",
    "nvda",

    "amazon",
    "amzn",

    "google",
    "alphabet",
    "googl",

    "meta",
    "facebook",

    "netflix",
    "nflx"
  ];

  return companyWords.includes(value);
}

  /* =========================================================
  COMPARE ONLY MESSAGE
========================================================= */


  function isComparisonRequest(text) {
  const value = normalize(text);

  return (
    value.includes(" vs ") ||
    value.includes(" versus ") ||
    value.includes("compare ") ||
    value.includes("comparison") ||
    value.includes("difference between")
  );
}

/* =========================================================
HELP / START
========================================================= */

function isHelpRequest(text) {
  const value = normalize(text);

  return (
    value === "help" ||
    value === "/help" ||
    value.includes("what can you do") ||
    value.includes("what can i ask")
  );
}

/* =========================================================
EXPORTS
========================================================= */

module.exports = {
  normalize,

  isWatchlistRequest,
  isAddRequest,
  isRemoveRequest,

  isLivePriceRequest,
  isWatchlistLiveFinanceRequest,

  isNewsRequest,
  isEarningsRequest,
  isSecRequest,

  isCompanyOnlyMessage,
  isHelpRequest,
  isComparisonRequest
};