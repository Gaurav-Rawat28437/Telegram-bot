const {
  getCompanyNews
} = require("./finnhubService");

function dateString(date) {
  return date
    .toISOString()
    .split("T")[0];
}

async function getLatestNews(
  symbol
) {
  const today =
    new Date();

  const previous =
    new Date();

  previous.setDate(
    previous.getDate() - 7
  );

  return getCompanyNews(
    symbol,
    dateString(previous),
    dateString(today)
  );
}

module.exports = {
  getLatestNews
};