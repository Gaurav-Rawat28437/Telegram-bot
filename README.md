# 🤖 Atlas AI — Financial Telegram Assistant

Atlas AI is an AI-powered Telegram financial assistant that allows users to interact with financial information using natural language.

The bot combines AI-powered conversations with financial market data, company news, earnings information, SEC filings, and a persistent personal watchlist.

## 🚀 Features

### 💬 Natural Language Conversation

Users can communicate with Atlas AI naturally instead of relying only on commands.

Examples:

* `Hello`
* `How are you?`
* `What is a stock?`
* `What is market capitalization?`
* `Apple vs Samsung`

Atlas AI uses Gemini for general conversational and financial questions.

### 📊 Live Stock Prices

Get current market information for supported companies.

Examples:

* `Tesla price`
* `What's Apple's price now?`
* `Live Tesla`
* `Apple live finance`

The bot can provide:

* Current price
* Price change
* Change percentage
* Day high
* Day low
* Opening price
* Previous close

### ⭐ Personal Watchlist

Users can create and manage their own watchlist.

Examples:

* `Track Tesla`
* `Track Apple`
* `Add NVIDIA to my watchlist`
* `Remove Tesla`
* `Show my watchlist`

Each user's watchlist is stored persistently in MongoDB.

### 📈 Watchlist Live Finance

Users can request live market information for all companies in their watchlist.

Example:

```text
My watchlist live finance
```

Atlas returns the latest available market information for each tracked company.

### 📰 Company News

Users can request recent company news.

Examples:

```text
Latest news about Tesla
```

```text
News about Apple
```

The bot retrieves recent financial/company news and displays headlines, summaries, and source links.

### 💰 Earnings Information

Users can request company earnings information.

Examples:

```text
Tesla earnings
```

```text
Apple earnings
```

The bot provides available:

* Earnings dates
* EPS actual
* EPS estimate
* Revenue actual
* Revenue estimate

### 📄 SEC Filings

Users can request recent SEC filings for supported companies.

Examples:

```text
Show Tesla SEC filings
```

```text
Apple SEC filings
```

The bot retrieves recent filings and displays:

* Filing type
* Filing date
* Accession number
* Primary document

### 🧠 AI Financial Assistant

Atlas AI uses Google's Gemini API to handle natural conversations and financial questions that are not direct market-data requests.

The AI receives relevant conversation history and financial context when available.

### 💾 Persistent Conversations

User conversations are stored in MongoDB.

This allows Atlas AI to maintain conversational context across messages.

### 🛡️ Error Handling

The bot includes error handling for:

* Gemini API failures
* Gemini quota limitations
* Financial API failures
* Invalid company requests
* SEC API failures
* Database errors
* Telegram response errors

The bot provides user-friendly fallback messages instead of crashing.

---

# 🏗️ Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### APIs & Services

* Telegram Bot API
* Google Gemini API
* Finnhub API
* SEC EDGAR API

### Libraries

* Telegraf
* Mongoose
* dotenv
* Google Generative AI SDK

### Development & Deployment

* Git
* GitHub
* Google Cloud
* MongoDB Atlas

---

# 📁 Project Structure

```text
Telegram-bot/
│
├── src/
│   ├── controllers/
│   │   └── ...
│   │
│   ├── models/
│   │   ├── User.js
│   │   └── Conversation.js
│   │
│   ├── services/
│   │   ├── aiService.js
│   │   ├── companyService.js
│   │   ├── finnhubService.js
│   │   ├── newsService.js
│   │   └── secService.js
│   │
│   ├── utils/
│   │   ├── companyResolver.js
│   │   ├── formatter.js
│   │   └── intent.js
│   │
│   └── ...
│
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

> The exact structure may vary depending on the final deployed version of the project.

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

TELEGRAM_BOT_TOKEN=your_telegram_bot_token

GEMINI_API_KEY=your_gemini_api_key

GEMINI_MODEL=gemini-1.5-flash

FINNHUB_API_KEY=your_finnhub_api_key
```

If your project uses additional environment variables, add them to your local `.env` file.

**Never commit `.env` or API keys to GitHub.**

---

# 🛠️ Installation

Clone the repository:

```bash
git clone https://github.com/Gaurav-Rawat28437/Telegram-bot.git
```

Move into the project directory:

```bash
cd Telegram-bot
```

Install dependencies:

```bash
npm install
```

Create the `.env` file:

```bash
touch .env
```

Add the required API keys and database configuration.

---

# ▶️ Run the Application

For development:

```bash
npm run dev
```

Or:

```bash
npm start
```

Once the application is running, open Telegram and search for:

```text
@UVAtlasbot
```

---

# 🤖 Telegram Bot

**Bot Username:** `@UVAtlasbot`

**Bot:**
https://t.me/UVAtlasbot

---

# 🧪 Example Queries

### Watchlist

```text
Track Tesla
```

```text
Track Apple
```

```text
Show my watchlist
```

```text
My watchlist live finance
```

### Live Finance

```text
What's Tesla's price?
```

```text
Apple live
```

```text
Live Tesla
```

### News

```text
Latest news about Tesla
```

```text
News about Apple
```

### Earnings

```text
Tesla earnings
```

```text
Apple earnings
```

### SEC

```text
Show Tesla SEC filings
```

```text
Apple SEC filings
```

### General AI

```text
Hello
```

```text
How are you?
```

```text
What is market capitalization?
```

```text
Apple vs Samsung
```

---

# 🔄 Request Processing

Atlas AI processes messages using an intent-based flow.

```text
Telegram Message
       │
       ▼
Message Handler
       │
       ├── Watchlist Request
       │
       ├── Track / Add Company
       │
       ├── Remove Company
       │
       ├── Live Finance
       │
       ├── Company News
       │
       ├── Earnings
       │
       ├── SEC Filings
       │
       └── General Conversation
                    │
                    ▼
               Gemini AI
```

Specific financial requests are handled directly through the relevant financial APIs.

General conversational questions are passed to Gemini.

---

# 🔐 Security

Sensitive credentials are stored in environment variables.

The following files should **never** be committed:

```text
.env
node_modules/
```

The repository uses `.gitignore` to prevent sensitive/local files from being uploaded.

---

# 📌 Important Notes

* Live market data depends on the availability and limits of the financial data provider.
* Gemini responses depend on Google Gemini API availability and quota.
* SEC information is retrieved from publicly available SEC data.
* The bot provides financial information for informational purposes and does not provide guaranteed or personalized investment advice.

---

# 👨‍💻 Author

**Gaurav Singh Rawat**

GitHub:
https://github.com/Gaurav-Rawat28437

Telegram Bot:
https://t.me/UVAtlasbot

---

# 📄 License

This project was created as a technical assignment/project demonstration.
