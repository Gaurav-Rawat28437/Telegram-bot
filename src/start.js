require("dotenv").config();

console.log("🚀 Starting Atlas AI...");

// Start Express server
require("./server");

// Start Telegram bot
require("./telegram/bot");