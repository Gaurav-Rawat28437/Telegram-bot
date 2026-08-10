const axios = require("axios");

const BASE_URL =
  "https://finnhub.io/api/v1";


async function finnhubRequest(
  endpoint,
  params = {}
) {
  if (!process.env.FINNHUB_API_KEY) {
    throw new Error(
      "FINNHUB_API_KEY is missing in .env"
    );
  }

  const response =
    await axios.get(
      `${BASE_URL}/${endpoint}`,
      {
        params: {
          ...params,
          token:
            process.env.FINNHUB_API_KEY
        },

        timeout: 15000
      }
    );

  return response.data;
}


async function getQuote(symbol) {
  return finnhubRequest(
    "quote",
    {
      symbol
    }
  );
}


async function getCompanyProfile(symbol) {
  return finnhubRequest(
    "stock/profile2",
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
    "company-news",
    {
      symbol,
      from,
      to
    }
  );
}


async function getEarnings(symbol) {
  return finnhubRequest(
    "calendar/earnings",
    {
      symbol
    }
  );
}


module.exports = {
  finnhubRequest,
  getQuote,
  getCompanyProfile,
  getCompanyNews,
  getEarnings
};