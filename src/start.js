require("dotenv").config();

console.log("🚀 Starting Atlas AI...");

require("./server");

require("./telegram/bot");

console.log("🤖 Telegram bot module loaded");