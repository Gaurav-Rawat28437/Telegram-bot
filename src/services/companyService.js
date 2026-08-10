const {
  resolveCompany
} = require("../utils/companyResolver");

const {
  getQuote,
  getCompanyProfile
} = require("./finnhubService");

function getCompanyBySymbol(
  symbol
) {
  if (!symbol) {
    return null;
  }

  return resolveCompany(
    String(symbol)
      .toUpperCase()
  );
}

async function getLiveFinance(
  companyInput
) {
  const company =
    resolveCompany(
      companyInput
    );

  if (!company) {
    throw new Error(
      "Company not found"
    );
  }

  const quote =
    await getQuote(
      company.symbol
    );

  return {
    company,
    quote
  };
}

async function getCompanyOverview(
  companyInput
) {
  const company =
    resolveCompany(
      companyInput
    );

  if (!company) {
    throw new Error(
      "Company not found"
    );
  }

  const profile =
    await getCompanyProfile(
      company.symbol
    );

  return {
    company,
    profile
  };
}

async function getCompany(
  companyInput
) {
  return resolveCompany(
    companyInput
  );
}

module.exports = {
  resolveCompany,
  getCompanyBySymbol,
  getLiveFinance,
  getCompanyOverview,
  getCompany
};