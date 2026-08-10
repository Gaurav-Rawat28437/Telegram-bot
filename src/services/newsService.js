const {
  getCompanyNews
} = require("./finnhubService");

function formatDate(date) {
  return date
    .toISOString()
    .split("T")[0];
}

async function getLatestNews(
  symbol
) {
  const to =
    new Date();

  const from =
    new Date();

  from.setDate(
    from.getDate() - 7
  );

  return getCompanyNews(
    symbol,
    formatDate(from),
    formatDate(to)
  );
}

module.exports = {
  getLatestNews
};