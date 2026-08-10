function money(value) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return "N/A";
  }

  return Number(value)
    .toFixed(2);
}

function signed(value) {
  const number =
    Number(value);

  if (Number.isNaN(number)) {
    return "N/A";
  }

  return (
    number >= 0 ? "+" : ""
  ) + number.toFixed(2);
}

function percent(value) {
  const number =
    Number(value);

  if (Number.isNaN(number)) {
    return "N/A";
  }

  return (
    number >= 0 ? "+" : ""
  ) + number.toFixed(2) + "%";
}

function formatQuote(
  company,
  quote
) {
  const direction =
    Number(quote.d) >= 0
      ? "🟢"
      : "🔴";

  return `
📊 ${company.name} (${company.symbol})

🔴 Live Finance Update

💰 Current Price: $${money(quote.c)}
${direction} Change: ${signed(quote.d)}
📊 Change %: ${percent(quote.dp)}

📈 Day High: $${money(quote.h)}
📉 Day Low: $${money(quote.l)}
🔓 Open: $${money(quote.o)}
🔒 Previous Close: $${money(quote.pc)}

🕐 Market data fetched just now.
`.trim();
}

module.exports = {
  money,
  signed,
  percent,
  formatQuote
};