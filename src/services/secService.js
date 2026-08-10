const axios = require("axios");

const BASE_URL =
  "https://finnhub.io/api/v1";

function getApiKey() {
  if (!process.env.FINNHUB_API_KEY) {
    throw new Error(
      "FINNHUB_API_KEY is missing"
    );
  }

  return process.env.FINNHUB_API_KEY;
}

async function finnhubRequest(
  endpoint,
  params = {}
) {
  const response =
    await axios.get(
      `${BASE_URL}${endpoint}`,
      {
        params: {
          ...params,
          token: getApiKey()
        },
        timeout: 10000
      }
    );

  return response.data;
}

async function getQuote(symbol) {
  return finnhubRequest(
    "/quote",
    {
      symbol
    }
  );
}

async function getCompanyProfile(symbol) {
  return finnhubRequest(
    "/stock/profile2",
    {
      symbol
    }
  );
}

async function getCompanyNews(
  symbol,
  from,
  to
) {
  return finnhubRequest(
    "/company-news",
    {
      symbol,
      from,
      to
    }
  );
}

async function getEarnings(symbol) {
  return finnhubRequest(
    "/calendar/earnings",
    {
      symbol
    }
  );
}

async function getRecommendation(symbol) {
  return finnhubRequest(
    "/stock/recommendation",
    {
      symbol
    }
  );
}

module.exports = {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
  getEarnings,
  getRecommendation
};