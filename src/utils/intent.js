function normalize(text) {
  return text
    .toLowerCase()
    .trim();
}

function isWatchlistRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("watchlist") ||
    value.includes("watch list") ||
    value.includes("companies am i watching") ||
    value.includes("what am i watching")
  );
}

function isAddRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("add ") &&
    (
      value.includes("watchlist") ||
      value.includes("watch list") ||
      value.startsWith("add ")
    )
  );
}

function isRemoveRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("remove ") ||
    value.includes("delete ")
  ) &&
  (
    value.includes("watchlist") ||
    value.includes("watch list") ||
    value.startsWith("remove ") ||
    value.startsWith("delete ")
  );
}

function isLivePriceRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("price") ||
    value.includes("stock price") ||
    value.includes("live price") ||
    value.includes("trading at")
  );
}

function isNewsRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("latest news") ||
    value.includes("recent news") ||
    value.includes("news about") ||
    value.includes("what happened")
  );
}

function isEarningsRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("earnings") ||
    value.includes("eps") ||
    value.includes("quarter results")
  );
}

function isSecRequest(text) {
  const value =
    normalize(text);

  return (
    value.includes("sec filing") ||
    value.includes("sec filings") ||
    value.includes("10-k") ||
    value.includes("10-q") ||
    value.includes("8-k") ||
    value.includes("filing")
  );
}

module.exports = {
  isWatchlistRequest,
  isAddRequest,
  isRemoveRequest,
  isLivePriceRequest,
  isNewsRequest,
  isEarningsRequest,
  isSecRequest
};