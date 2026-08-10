function formatNumber(
  value,
  decimals = 2
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return number.toFixed(decimals);
}

function formatQuote(
  company,
  quote
) {
  const price =
    Number(quote?.c || 0);

  const change =
    Number(quote?.d || 0);

  const changePercent =
    Number(quote?.dp || 0);

  const high =
    Number(quote?.h || 0);

  const low =
    Number(quote?.l || 0);

  const open =
    Number(quote?.o || 0);

  const previousClose =
    Number(quote?.pc || 0);

  const positive =
    change >= 0;

  const icon =
    positive
      ? "🟢"
      : "🔴";

  const sign =
    positive
      ? "+"
      : "";

  return [
    `📊 ${company.name} (${company.symbol})`,
    "",
    `💰 Current Price: $${formatNumber(price)}`,
    `${icon} Change: ${sign}${formatNumber(change)}`,
    `📊 Change %: ${sign}${formatNumber(changePercent)}%`,
    "",
    `📈 Day High: $${formatNumber(high)}`,
    `📉 Day Low: $${formatNumber(low)}`,
    `🔓 Open: $${formatNumber(open)}`,
    `🔒 Previous Close: $${formatNumber(previousClose)}`
  ].join("\n");
}

function formatWatchlistQuote(
  company,
  quote
) {
  const price =
    Number(quote?.c || 0);

  const change =
    Number(quote?.d || 0);

  const changePercent =
    Number(quote?.dp || 0);

  const positive =
    change >= 0;

  const icon =
    positive
      ? "🟢"
      : "🔴";

  const sign =
    positive
      ? "+"
      : "";

  return [
    `📈 ${company.name} (${company.symbol})`,
    `💰 Price: $${formatNumber(price)}`,
    `${icon} ${sign}${formatNumber(change)} (${sign}${formatNumber(changePercent)}%)`
  ].join("\n");
}

module.exports = {
  formatQuote,
  formatWatchlistQuote
};