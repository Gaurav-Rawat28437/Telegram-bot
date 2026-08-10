require("dotenv").config();

const {
  Telegraf
} = require("telegraf");

const cron =
  require("node-cron");

const connectDB =
  require("../config/db");

const User =
  require("../models/User");

const {
  handleNaturalMessage
} = require("./handlers");

const {
  getQuote
} = require("../services/finnhubService");


const bot =
  new Telegraf(
    process.env.TELEGRAM_BOT_TOKEN
  );


async function getOrCreateUser(ctx) {
  const telegramId =
    String(ctx.from.id);

  let user =
    await User.findOne({
      telegramId
    });

  if (!user) {
    user =
      await User.create({
        telegramId,

        username:
          ctx.from.username || "",

        firstName:
          ctx.from.first_name || "",

        role: "",

        watchlist: [],

        pendingIntent: ""
      });

    console.log(
      "New user created:",
      telegramId
    );
  }

  return user;
}


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

bot.start(
  async (ctx) => {
    try {
      const user =
        await getOrCreateUser(
          ctx
        );

      if (!user.role) {
        await ctx.reply(
          [
            "👋 Hello!",
            "",
            "I'm your AI financial assistant.",
            "",
            "Before we start, tell me your role:",
            "",
            "• Investor",
            "• Analyst",
            "• Trader",
            "• Student",
            "• Finance Professional",
            "• Founder",
            "• Other"
          ].join("\n")
        );

        return;
      }

      await ctx.reply(
        [
          "👋 Welcome back!",
          "",
          `Role: ${user.role}`,
          "",
          "You can now talk to me naturally.",
          "",
          "Try:",
          "• Add Tesla to my watchlist",
          "• What's Apple's price now?",
          "• What companies am I watching?",
          "• My watchlist live finance",
          "• Latest news about Tesla"
        ].join("\n")
      );
    } catch (error) {
      console.error(
        "START ERROR:",
        error
      );

      await ctx.reply(
        "⚠️ Something went wrong. Please try /start again."
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| TEXT
|--------------------------------------------------------------------------
*/

bot.on(
  "text",
  async (ctx) => {
    try {
      const text =
        String(
          ctx.message.text || ""
        ).trim();

      if (!text) {
        return;
      }

      if (
        text === "/start"
      ) {
        return;
      }

      const user =
        await getOrCreateUser(
          ctx
        );


      /*
      |--------------------------------------------------------------------------
      | ROLE SETUP
      |--------------------------------------------------------------------------
      */

      if (!user.role) {
        const role =
          text
            .toLowerCase()
            .trim();

        const allowedRoles = [
          "investor",
          "analyst",
          "trader",
          "student",
          "finance professional",
          "founder",
          "other"
        ];

        const matchedRole =
          allowedRoles.find(
            (item) =>
              role === item
          );

        if (!matchedRole) {
          await ctx.reply(
            [
              "Please choose one of these roles:",
              "",
              "Investor",
              "Analyst",
              "Trader",
              "Student",
              "Finance Professional",
              "Founder",
              "Other"
            ].join("\n")
          );

          return;
        }

        user.role =
          matchedRole;

        await user.save();

        await ctx.reply(
          [
            "✅ Profile setup complete.",
            "",
            `Role: ${matchedRole}`,
            "",
            "You can now talk to me naturally.",
            "",
            "Try:",
            "• Add Tesla to my watchlist",
            "• What's Apple's price now?",
            "• What companies am I watching?",
            "• My watchlist live finance",
            "• Latest news about Tesla"
          ].join("\n")
        );

        return;
      }


      /*
      |--------------------------------------------------------------------------
      | HANDLE MESSAGE
      |--------------------------------------------------------------------------
      */

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
    }
  }
);


/*
|--------------------------------------------------------------------------
| DAILY WATCHLIST BRIEFING
|--------------------------------------------------------------------------
*/

cron.schedule(
  "0 20 * * *",
  async () => {
    console.log(
      "Running daily 8 PM briefing..."
    );

    try {
      const users =
        await User.find({
          "watchlist.0": {
            $exists: true
          }
        });

      for (
        const user of users
      ) {
        const lines = [
          "🌙 Daily Finance Update",
          "",
          "Your watchlist:"
        ];

        for (
          const item of user.watchlist
        ) {
          try {
            const quote =
              await getQuote(
                item.symbol
              );

            const price =
              Number(
                quote?.c || 0
              );

            const change =
              Number(
                quote?.d || 0
              );

            const percent =
              Number(
                quote?.dp || 0
              );

            const icon =
              change >= 0
                ? "🟢"
                : "🔴";

            const sign =
              change >= 0
                ? "+"
                : "";

            lines.push(
              "",
              `📈 ${item.name} (${item.symbol})`,
              `💰 $${price.toFixed(2)}`,
              `${icon} ${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`
            );
          } catch (error) {
            console.error(
              `Briefing error ${item.symbol}:`,
              error.message
            );
          }
        }

        await bot.telegram.sendMessage(
          user.telegramId,
          lines.join("\n")
        );
      }
    } catch (error) {
      console.error(
        "BRIEFING ERROR:",
        error.message
      );
    }
  },
  {
    timezone:
      process.env.TIMEZONE ||
      "Asia/Kolkata"
  }
);


async function startBot() {
  try {
    await connectDB();

    console.log(
      "MongoDB connected for Telegram bot."
    );

    console.log(
      "Daily briefing scheduled at 08:00 Asia/Kolkata"
    );

    await bot.launch();

    console.log(
      "🚀 Telegram bot is running."
    );
  } catch (error) {
    console.error(
      "BOT STARTUP ERROR:",
      error
    );

    process.exit(1);
  }
}


startBot();


process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);