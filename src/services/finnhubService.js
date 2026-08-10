const https = require("https");

const API_KEY = process.env.FINNHUB_API_KEY;

/**
 * Make a request to Finnhub.
 */
function finnhubRequest(endpoint) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      return reject(
        new Error(
          "FINNHUB_API_KEY is missing from your .env file."
        )
      );
    }

    const separator = endpoint.includes("?")
      ? "&"
      : "?";

    const url =
      `https://finnhub.io/api/v1${endpoint}` +
      `${separator}token=${encodeURIComponent(API_KEY)}`;

    https
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          if (
            response.statusCode < 200 ||
            response.statusCode >= 300
          ) {
            return reject(
              new Error(
                `Finnhub ${response.statusCode}: ${data}`
              )
            );
          }

          try {
            const json = JSON.parse(data);

            resolve(json);
          } catch (error) {
            reject(
              new Error(
                "Finnhub returned invalid JSON."
              )
            );
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Get live stock quote.
 *
 * Returns:
 * {
 *   c: current price,
 *   d: change,
 *   dp: change percentage,
 *   h: high,
 *   l: low,
 *   o: open,
 *   pc: previous close
 * }
 */
async function getQuote(symbol) {
  if (!symbol) {
    throw new Error("Stock symbol is required.");
  }

  return await finnhubRequest(
    `/quote?symbol=${encodeURIComponent(symbol)}`
  );
}

/**
 * Get company profile.
 */
async function getCompanyProfile(symbol) {
  if (!symbol) {
    throw new Error("Stock symbol is required.");
  }

  return await finnhubRequest(
    `/stock/profile2?symbol=${encodeURIComponent(symbol)}`
  );
}

/**
 * Search Finnhub companies.
 *
 * IMPORTANT:
 * Only send a short search term.
 *
 * Do NOT send:
 * "Add Tesla to my watchlist"
 *
 * Send:
 * "Tesla"
 */
async function searchCompany(query) {
  if (!query) {
    return [];
  }

  const cleanQuery = String(query)
    .trim()
    .slice(0, 50);

  if (!cleanQuery) {
    return [];
  }

  const result = await finnhubRequest(
    `/search?q=${encodeURIComponent(cleanQuery)}`
  );

  return result.result || [];
}

module.exports = {
  finnhubRequest,
  getQuote,
  getCompanyProfile,
  searchCompany
};