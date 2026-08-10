const COMPANIES = [
  {
    name: "Apple",
    symbol: "AAPL",
    aliases: [
      "apple",
      "aapl"
    ]
  },

  {
    name: "Tesla",
    symbol: "TSLA",
    aliases: [
      "tesla",
      "tsla"
    ]
  },

  {
    name: "Microsoft",
    symbol: "MSFT",
    aliases: [
      "microsoft",
      "msft"
    ]
  },

  {
    name: "NVIDIA",
    symbol: "NVDA",
    aliases: [
      "nvidia",
      "nvda"
    ]
  },

  {
    name: "Amazon",
    symbol: "AMZN",
    aliases: [
      "amazon",
      "amzn"
    ]
  },

  {
    name: "Alphabet",
    symbol: "GOOGL",
    aliases: [
      "google",
      "alphabet",
      "googl"
    ]
  },

  {
    name: "Meta",
    symbol: "META",
    aliases: [
      "meta",
      "facebook",
      "fb"
    ]
  },

  {
    name: "Netflix",
    symbol: "NFLX",
    aliases: [
      "netflix",
      "nflx"
    ]
  }
];


function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim();
}


function resolveCompany(text) {
  if (!text) {
    return null;
  }

  const value =
    normalize(text);

  // Exact match
  for (const company of COMPANIES) {
    if (
      company.aliases.includes(value)
    ) {
      return {
        name: company.name,
        symbol: company.symbol
      };
    }
  }

  // Match inside sentence
  for (const company of COMPANIES) {
    for (const alias of company.aliases) {
      const regex =
        new RegExp(
          `\\b${escapeRegExp(alias)}\\b`,
          "i"
        );

      if (regex.test(value)) {
        return {
          name: company.name,
          symbol: company.symbol
        };
      }
    }
  }

  return null;
}


function escapeRegExp(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}


function getSupportedCompanies() {
  return COMPANIES.map(
    (company) => ({
      name: company.name,
      symbol: company.symbol
    })
  );
}


module.exports = {
  resolveCompany,
  getSupportedCompanies
};