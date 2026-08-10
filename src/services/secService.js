const axios = require("axios");

const SEC_BASE_URL =
  "https://data.sec.gov/submissions";

async function getCompanySubmissions(
  cik
) {
  if (!cik) {
    throw new Error(
      "SEC CIK is required"
    );
  }

  const normalized =
    String(cik)
      .replace(/\D/g, "")
      .padStart(10, "0");

  const userAgent =
    process.env.SEC_USER_AGENT ||
    "AtlasAI financial assistant";

  try {
    const response =
      await axios.get(
        `${SEC_BASE_URL}/CIK${normalized}.json`,
        {
          headers: {
            "User-Agent": userAgent,
            Accept:
              "application/json"
          },
          timeout: 10000
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      "SEC API error:",
      error.response?.status ||
        error.message
    );

    throw new Error(
      "SEC request failed"
    );
  }
}

function getRecentFilings(
  data,
  limit = 5
) {
  const recent =
    data?.filings?.recent;

  if (!recent) {
    return [];
  }

  const filings = [];

  for (
    let i = 0;
    i < recent.form.length &&
    filings.length < limit;
    i++
  ) {
    filings.push({
      form:
        recent.form[i],

      filingDate:
        recent.filingDate[i],

      accessionNumber:
        recent.accessionNumber[i],

      primaryDocument:
        recent.primaryDocument[i]
    });
  }

  return filings;
}

module.exports = {
  getCompanySubmissions,
  getRecentFilings
};