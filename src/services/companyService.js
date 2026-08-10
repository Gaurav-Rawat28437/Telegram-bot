const {
  resolveCompany
} = require("../utils/companyResolver");

const {
  getQuote,
  getCompanyProfile
} = require("./finnhubService");

/*
|--------------------------------------------------------------------------
| Company database
|--------------------------------------------------------------------------
|
| This is used when the user already has a company in MongoDB and
| mentions it again in a natural conversation.
|
*/

const companyMap = {
  AAPL: {
    name: "Apple",
    symbol: "AAPL"
  },

  TSLA: {
    name: "Tesla",
    symbol: "TSLA"
  },

  MSFT: {
    name: "Microsoft",
    symbol: "MSFT"
  },

  NVDA: {
    name: "NVIDIA",
    symbol: "NVDA"
  },

  AMZN: {
    name: "Amazon",
    symbol: "AMZN"
  },

  GOOGL: {
    name: "Alphabet",
    symbol: "GOOGL"
  },

  META: {
    name: "Meta Platforms",
    symbol: "META"
  },

  NFLX: {
    name: "Netflix",
    symbol: "NFLX"
  }
};


/*
|--------------------------------------------------------------------------
| Get company by symbol
|--------------------------------------------------------------------------
*/

function getCompanyBySymbol(symbol) {
  if (!symbol) {
    return null;
  }

  return (
    companyMap[
      String(symbol).toUpperCase()
    ] || null
  );
}


/*
|--------------------------------------------------------------------------
| Resolve company from user text
|--------------------------------------------------------------------------
*/

function resolveInput(companyInput) {
  if (!companyInput) {
    return null;
  }

  /*
   * First try the resolver.
   *
   * Example:
   *
   * Tesla
   * Apple
   * TSLA
   */

  const resolved =
    resolveCompany(companyInput);

  if (resolved) {
    return resolved;
  }

  /*
   * Then try symbol directly.
   */

  const bySymbol =
    getCompanyBySymbol(
      companyInput
    );

  if (bySymbol) {
    return bySymbol;
  }

  return null;
}


/*
|--------------------------------------------------------------------------
| Get live finance
|--------------------------------------------------------------------------
*/

async function getLiveFinance(
  companyInput
) {
  const company =
    resolveInput(companyInput);

  if (!company) {
    throw new Error(
      `Company "${companyInput}" could not be identified.`
    );
  }

  const quote =
    await getQuote(
      company.symbol
    );

  return {
    name: company.name,
    symbol: company.symbol,
    quote
  };
}


/*
|--------------------------------------------------------------------------
| Get company profile
|--------------------------------------------------------------------------
*/

async function getCompanyOverview(
  companyInput
) {
  const company =
    resolveInput(companyInput);

  if (!company) {
    throw new Error(
      `Company "${companyInput}" could not be identified.`
    );
  }

  const profile =
    await getCompanyProfile(
      company.symbol
    );

  return {
    name: company.name,
    symbol: company.symbol,
    profile
  };
}


/*
|--------------------------------------------------------------------------
| Get company + live quote
|--------------------------------------------------------------------------
*/

async function getCompany(
  companyInput
) {
  const company =
    resolveInput(companyInput);

  if (!company) {
    throw new Error(
      `Company "${companyInput}" could not be identified.`
    );
  }

  const [
    profile,
    quote
  ] = await Promise.all([
    getCompanyProfile(
      company.symbol
    ),

    getQuote(
      company.symbol
    )
  ]);

  return {
    name: company.name,
    symbol: company.symbol,
    profile,
    quote
  };
}


/*
|--------------------------------------------------------------------------
| Format live finance
|--------------------------------------------------------------------------
*/

function formatLiveFinance(
  data
) {
  if (!data) {
    return (
      "⚠️ Live financial information " +
      "is currently unavailable."
    );
  }

  const {
    name,
    symbol,
    quote
  } = data;

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

  const changeIcon =
    change >= 0
      ? "🟢"
      : "🔴";

  const changeSign =
    change >= 0
      ? "+"
      : "";

  const percentSign =
    changePercent >= 0
      ? "+"
      : "";

  return (
    `📊 ${name} (${symbol})\n\n` +

    `🔴 Live Finance Update\n\n` +

    `💰 Current Price: $${price.toFixed(2)}\n` +

    `${changeIcon} Change: ` +
    `${changeSign}${change.toFixed(2)}\n` +

    `📊 Change %: ` +
    `${percentSign}${changePercent.toFixed(2)}%\n\n` +

    `📈 Day High: $${high.toFixed(2)}\n` +

    `📉 Day Low: $${low.toFixed(2)}\n` +

    `🔓 Open: $${open.toFixed(2)}\n` +

    `🔒 Previous Close: ` +
    `$${previousClose.toFixed(2)}\n\n` +

    `🕐 Market data fetched just now.`
  );
}


/*
|--------------------------------------------------------------------------
| Format company overview
|--------------------------------------------------------------------------
*/

function formatCompanyOverview(
  data
) {
  if (!data) {
    return (
      "⚠️ Company information " +
      "is currently unavailable."
    );
  }

  const {
    name,
    symbol,
    profile
  } = data;

  return (
    `🏢 ${name} (${symbol})\n\n` +

    `Industry: ` +
    `${profile?.finnhubIndustry || "Not available"}\n` +

    `Country: ` +
    `${profile?.country || "Not available"}\n` +

    `Exchange: ` +
    `${profile?.exchange || "Not available"}\n\n` +

    `🌐 Website: ` +
    `${profile?.weburl || "Not available"}`
  );
}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getCompanyBySymbol,
  getLiveFinance,
  getCompanyOverview,
  getCompany,
  formatLiveFinance,
  formatCompanyOverview
};