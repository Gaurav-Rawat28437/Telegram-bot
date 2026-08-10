require("dotenv").config();

const dns =
  require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

const {
  Telegraf
} = require("telegraf");

const connectDB =
  require("../config/db");

const User =
  require("../models/User");

const {
  handleNaturalMessage
} = require("./handlers");

const {
  startScheduler
} = require("./scheduler");

const bot =
  new Telegraf(
    process.env.BOT_TOKEN
  );

const processingUsers =
  new Set();

async function createOrUpdateUser(
  ctx
) {
  const telegramId =
    String(ctx.from.id);

  const username =
    ctx.from.username || "";

  const firstName =
    ctx.from.first_name || "there";

  let user =
    await User.findOne({
      telegramId
    });

  if (!user) {
    user =
      await User.create({
        telegramId,
        username,
        firstName,
        watchlist: []
      });

    console.log(
      "NEW USER CREATED:",
      telegramId
    );

  } else {
    user.username =
      username;

    user.firstName =
      firstName;

    await user.save();

    console.log(
      "EXISTING USER UPDATED:",
      telegramId
    );
  }

  return user;
}

bot.start(
  async (ctx) => {
    try {
      const user =
        await createOrUpdateUser(
          ctx
        );

      if (!user.role) {
        await ctx.reply(
          `👋 Hello ${user.firstName}!

Welcome to UV-Atlas 🤖📈

I'm your personal AI financial assistant.

First, tell me what best describes you:

• Investor
• Analyst
• Trader
• Student
• Finance Professional
• Founder
• Other`
        );

        return;
      }

      await ctx.reply(
        `👋 Welcome back, ${user.firstName}!

Your profile is ready.

Role: ${user.role}

You can talk to me naturally.

For example:

• Tell me about Apple
• What's Apple's price now?
• Add Tesla to my watchlist
• What companies am I watching?
• Remove Microsoft
• What's the latest news about Nvidia?
• Show Tesla's latest SEC filing
• What are Apple's latest earnings?

I'll remember our conversations and the companies you follow.`
      );

    } catch (error) {
      console.error(
        "START ERROR:",
        error.message
      );

      await ctx.reply(
        "⚠️ I couldn't start UV-Atlas right now. Please try /start again."
      );
    }
  }
);

const roles = [
  "student",
  "investor",
  "trader",
  "analyst",
  "finance professional",
  "founder",
  "other"
];

for (
  const role of roles
) {
  bot.hears(
    new RegExp(
      `^${role}$`,
      "i"
    ),
    async (ctx) => {
      try {
        const telegramId =
          String(ctx.from.id);

        const user =
          await User.findOne({
            telegramId
          });

        if (!user) {
          await ctx.reply(
            "Please send /start first."
          );

          return;
        }

        user.role =
          role;

        await user.save();

        await ctx.reply(
          `✅ Profile setup complete.

Role: ${role}

You can now talk to me naturally.

Try:

"Add Tesla to my watchlist"

"What's Apple's price now?"

"What companies am I watching?"

"What's the latest news about Tesla?"

I'll remember the companies you discuss.`
        );

      } catch (error) {
        console.error(
          "ROLE ERROR:",
          error.message
        );

        await ctx.reply(
          "⚠️ I couldn't save your role. Please try again."
        );
      }
    }
  );
}

bot.on(
  "text",
  async (ctx) => {
    const telegramId =
      String(ctx.from.id);

    const text =
      ctx.message.text.trim();

    if (
      text === "/start"
    ) {
      return;
    }

    if (
      processingUsers.has(
        telegramId
      )
    ) {
      await ctx.reply(
        "⏳ I'm still processing your previous request. Please wait a moment."
      );

      return;
    }

    processingUsers.add(
      telegramId
    );

    try {
      const user =
        await User.findOne({
          telegramId
        });

      if (!user) {
        await ctx.reply(
          "⚠️ I couldn't find your profile. Please send /start."
        );

        return;
      }

      if (!user.role) {
        await ctx.reply(
          "Please complete your profile first by sending /start."
        );

        return;
      }

      await handleNaturalMessage(
        ctx,
        user,
        text
      );

    } catch (error) {
      console.error(
        "MESSAGE ERROR:",
        error
      );

      await ctx.reply(
        "⚠️ Something went wrong while processing your request. Please try again."
      );

    } finally {
      processingUsers.delete(
        telegramId
      );
    }
  }
);

bot.catch(
  async (error, ctx) => {
    console.error(
      "GLOBAL TELEGRAM ERROR:",
      error
    );

    try {
      await ctx.reply(
        "⚠️ Something went wrong. Please try again."
      );
    } catch {}
  }
);

async function start() {
  try {
    await connectDB();

    console.log(
      "MongoDB Connected for Telegram Bot"
    );

    startScheduler(
      bot
    );

    await bot.launch();

    console.log(
      "🚀 UV-Atlas Telegram Bot is running..."
    );

  } catch (error) {
    console.error(
      "BOT STARTUP ERROR:",
      error
    );

    process.exit(1);
  }
}

start();

process.once(
  "SIGINT",
  () => {
    console.log(
      "Stopping bot..."
    );

    bot.stop(
      "SIGINT"
    );
  }
);

process.once(
  "SIGTERM",
  () => {
    console.log(
      "Stopping bot..."
    );

    bot.stop(
      "SIGTERM"
    );
  }
);