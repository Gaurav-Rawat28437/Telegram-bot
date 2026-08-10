const companies = {
  apple: {
    name: "Apple",
    symbol: "AAPL"
  },

  aapl: {
    name: "Apple",
    symbol: "AAPL"
  },

  microsoft: {
    name: "Microsoft",
    symbol: "MSFT"
  },

  msft: {
    name: "Microsoft",
    symbol: "MSFT"
  },

  tesla: {
    name: "Tesla",
    symbol: "TSLA"
  },

  tsla: {
    name: "Tesla",
    symbol: "TSLA"
  },

  nvidia: {
    name: "NVIDIA",
    symbol: "NVDA"
  },

  nvda: {
    name: "NVIDIA",
    symbol: "NVDA"
  },

  amazon: {
    name: "Amazon",
    symbol: "AMZN"
  },

  amzn: {
    name: "Amazon",
    symbol: "AMZN"
  },

  google: {
    name: "Alphabet",
    symbol: "GOOGL"
  },

  alphabet: {
    name: "Alphabet",
    symbol: "GOOGL"
  },

  googl: {
    name: "Alphabet",
    symbol: "GOOGL"
  },

  meta: {
    name: "Meta Platforms",
    symbol: "META"
  },

  facebook: {
    name: "Meta Platforms",
    symbol: "META"
  },

  netflix: {
    name: "Netflix",
    symbol: "NFLX"
  },

  nflx: {
    name: "Netflix",
    symbol: "NFLX"
  }
};

function resolveCompany(text) {
  if (!text) {
    return null;
  }

  const value = String(text)
    .trim()
    .toLowerCase();

  // Exact match
  if (companies[value]) {
    return companies[value];
  }

  /*
   * Search inside a sentence.
   *
   * Example:
   * "add tesla to my watchlist"
   * "what is apple price"
   * "tell me about microsoft"
   */
  for (const [keyword, company] of Object.entries(companies)) {
    const regex = new RegExp(
      `\\b${escapeRegex(keyword)}\\b`,
      "i"
    );

    if (regex.test(value)) {
      return company;
    }
  }

  return null;
}

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function getSupportedCompanies() {
  const unique = new Map();

  Object.values(companies).forEach((company) => {
    unique.set(company.symbol, company);
  });

  return Array.from(unique.values());
}

module.exports = {
  resolveCompany,
  getSupportedCompanies
};