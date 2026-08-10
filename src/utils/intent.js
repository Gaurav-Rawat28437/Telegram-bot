function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim();
}


/*
|--------------------------------------------------------------------------
| WATCHLIST
|--------------------------------------------------------------------------
*/

function isWatchlistRequest(text) {
  const value =
    normalize(text);

  return (
    value === "my watchlist" ||
    value === "watchlist" ||
    value === "my watch list" ||
    value.includes(
      "what companies am i watching"
    ) ||
    value.includes(
      "companies am i watching"
    ) ||
    value.includes(
      "show my watchlist"
    )
  );
}


/*
|--------------------------------------------------------------------------
| WATCHLIST LIVE FINANCE
|--------------------------------------------------------------------------
*/

function isWatchlistLiveFinanceRequest(
  text
) {
  const value =
    normalize(text);

  const hasWatchlist =
    value.includes("watchlist") ||
    value.includes("watch list") ||
    value.includes("companies i'm watching") ||
    value.includes("companies i am watching") ||
    value.includes("my companies");

  const hasFinance =
    value.includes("live finance") ||
    value.includes("live price") ||
    value.includes("current price") ||
    value.includes("prices now") ||
    value.includes("market update") ||
    value.includes("finance update");

  return (
    hasWatchlist &&
    hasFinance
  );
}


/*
|--------------------------------------------------------------------------
| ADD
|--------------------------------------------------------------------------
*/

function isAddRequest(text) {
  const value =
    normalize(text);

  return (
    /\badd\b/.test(value) &&
    (
      value.includes("watchlist") ||
      value.includes("watch list")
    )
  );
}


/*
|--------------------------------------------------------------------------
| REMOVE
|--------------------------------------------------------------------------
*/

function isRemoveRequest(text) {
  const value =
    normalize(text);

  return (
    /\b(remove|delete|unwatch)\b/.test(
      value
    ) &&
    (
      value.includes("watchlist") ||
      value.includes("watch list")
    )
  );
}


/*
|--------------------------------------------------------------------------
| LIVE FINANCE
|--------------------------------------------------------------------------
*/

function isLivePriceRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("live finance") ||
    value.includes("live price") ||
    value.includes("current price") ||
    value.includes("stock price") ||
    value.includes("price now") ||
    value.includes("price today") ||
    value.includes("trading at") ||
    value.includes("finance update") ||
    value.includes("market update")
  );
}


/*
|--------------------------------------------------------------------------
| NEWS
|--------------------------------------------------------------------------
*/

function isNewsRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("latest news") ||
    value.includes("recent news") ||
    value.includes("company news") ||
    value.includes("news about") ||
    value.includes("news on")
  );
}


/*
|--------------------------------------------------------------------------
| EARNINGS
|--------------------------------------------------------------------------
*/

function isEarningsRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("earnings") ||
    value.includes("earnings report") ||
    value.includes("earnings date")
  );
}


/*
|--------------------------------------------------------------------------
| SEC
|--------------------------------------------------------------------------
*/

function isSecRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("sec filing") ||
    value.includes("sec filings") ||
    value.includes("10-k") ||
    value.includes("10-q")
  );
}


module.exports = {
  isWatchlistRequest,
  isWatchlistLiveFinanceRequest,
  isAddRequest,
  isRemoveRequest,
  isLivePriceRequest,
  isNewsRequest,
  isEarningsRequest,
  isSecRequest
};