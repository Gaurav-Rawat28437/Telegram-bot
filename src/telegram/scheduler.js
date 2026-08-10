const cron =
  require("node-cron");

const {
  sendBriefings
} = require("../services/briefingService");

function startScheduler(
  bot
) {
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log(
        "Running 8 AM financial briefing..."
      );

      try {
        await sendBriefings(bot);
      } catch (error) {
        console.error(
          "Scheduler error:",
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

  console.log(
    "Daily briefing scheduler started."
  );

  console.log(
    "Briefing time:",
    "08:00",
    process.env.TIMEZONE ||
      "Asia/Kolkata"
  );
}

module.exports = {
  startScheduler
};