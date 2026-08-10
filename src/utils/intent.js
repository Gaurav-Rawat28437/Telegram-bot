function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/*
|--------------------------------------------------------------------------
| WATCHLIST LIVE FINANCE
|--------------------------------------------------------------------------
| Examples:
|
| my watchlist live finance
| live finance for my watchlist
| watchlist live prices
| live prices of my watchlist
| show live finance for my watchlist
| give me live updates for my watchlist
| live update for companies I'm watching
|--------------------------------------------------------------------------
*/

function isWatchlistLiveFinanceRequest(text) {
  const value = normalize(text);

  const hasWatchlist =
    value.includes("watchlist") ||
    value.includes("watch list") ||
    value.includes("companies i'm watching") ||
    value.includes("companies im watching") ||
    value.includes("companies i am watching") ||
    value.includes("companies i'm tracking") ||
    value.includes("companies im tracking") ||
    value.includes("companies i am tracking") ||
    value.includes("stocks i'm watching") ||
    value.includes("stocks im watching") ||
    value.includes("stocks i am watching");

  const hasLiveFinance =
    value.includes("live finance") ||
    value.includes("live price") ||
    value.includes("live prices") ||
    value.includes("live update") ||
    value.includes("live updates") ||
    value.includes("current price") ||
    value.includes("current prices") ||
    value.includes("market update") ||
    value.includes("market updates") ||
    value.includes("stock prices") ||
    value.includes("stock price");

  return hasWatchlist && hasLiveFinance;
}


/*
|--------------------------------------------------------------------------
| SHOW WATCHLIST
|--------------------------------------------------------------------------
*/

function isWatchlistRequest(text) {
  const value = normalize(text);

  if (isWatchlistLiveFinanceRequest(value)) {
    return false;
  }

  return (
    value.includes("watchlist") ||
    value.includes("watch list") ||
    value.includes("what companies am i watching") ||
    value.includes("what companies i'm watching") ||
    value.includes("what companies im watching") ||
    value.includes("companies am i watching") ||
    value.includes("what am i watching") ||
    value.includes("show my watchlist") ||
    value.includes("show my watch list") ||
    value.includes("my watchlist")
  );
}


/*
|--------------------------------------------------------------------------
| ADD TO WATCHLIST
|--------------------------------------------------------------------------
*/

function isAddRequest(text) {
  const value = normalize(text);

  return (
    /\badd\b/.test(value) &&
    (
      value.includes("watchlist") ||
      value.includes("watch list") ||
      value.length <= 40
    )
  );
}


/*
|--------------------------------------------------------------------------
| REMOVE FROM WATCHLIST
|--------------------------------------------------------------------------
*/

function isRemoveRequest(text) {
  const value = normalize(text);

  return (
    /\b(remove|delete|unwatch)\b/.test(value) &&
    (
      value.includes("watchlist") ||
      value.includes("watch list") ||
      value.length <= 50
    )
  );
}


/*
|--------------------------------------------------------------------------
| SINGLE COMPANY LIVE PRICE
|--------------------------------------------------------------------------
*/

function isLivePriceRequest(text) {
  const value = normalize(text);

  /*
   * Important:
   * Watchlist-wide requests must be handled separately.
   */
  if (isWatchlistLiveFinanceRequest(value)) {
    return false;
  }

  return (
    value.includes("live finance") ||
    value.includes("live price") ||
    value.includes("current price") ||
    value.includes("stock price") ||
    value.includes("price now") ||
    value.includes("price today") ||
    value.includes("trading at") ||
    value.includes("how much is") ||
    value.includes("market price")
  );
}


/*
|--------------------------------------------------------------------------
| NEWS
|--------------------------------------------------------------------------
*/

function isNewsRequest(text) {
  const value = normalize(text);

  return (
    value.includes("latest news") ||
    value.includes("recent news") ||
    value.includes("company news") ||
    value.includes("news about") ||
    value.includes("news on") ||
    value.includes("news for")
  );
}


/*
|--------------------------------------------------------------------------
| EARNINGS
|--------------------------------------------------------------------------
*/

function isEarningsRequest(text) {
  const value = normalize(text);

  return (
    value.includes("earnings") ||
    value.includes("earnings report") ||
    value.includes("earnings date") ||
    value.includes("quarterly earnings") ||
    value.includes("earnings results")
  );
}


/*
|--------------------------------------------------------------------------
| SEC
|--------------------------------------------------------------------------
*/

function isSecRequest(text) {
  const value = normalize(text);

  return (
    value.includes("sec filing") ||
    value.includes("sec filings") ||
    value.includes("10-k") ||
    value.includes("10-q") ||
    value.includes("filing") ||
    value.includes("filings")
  );
}


module.exports = {
  isWatchlistLiveFinanceRequest,
  isWatchlistRequest,
  isAddRequest,
  isRemoveRequest,
  isLivePriceRequest,
  isNewsRequest,
  isEarningsRequest,
  isSecRequest
};