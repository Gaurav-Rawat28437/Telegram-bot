const cron =
  require("node-cron");

const {
  createUserBriefing,
  getUsersForBriefing
} = require(
  "../services/briefingService"
);

function startScheduler(bot) {
  const hour =
    Number(
      process.env.BRIEFING_HOUR || 20
    );

  const minute =
    Number(
      process.env.BRIEFING_MINUTE || 0
    );

  const timezone =
    process.env.TIMEZONE ||
    "Asia/Kolkata";

  const expression =
    `${minute} ${hour} * * *`;

  cron.schedule(
    expression,
    async () => {
      console.log(
        "Running daily finance briefing..."
      );

      try {
        const users =
          await getUsersForBriefing();

        console.log(
          `Users for briefing: ${users.length}`
        );

        for (
          const user of users
        ) {
          try {
            const message =
              await createUserBriefing(
                user
              );

            if (!message) {
              continue;
            }

            await bot.telegram.sendMessage(
              user.telegramId,
              message
            );

            console.log(
              `Briefing sent to ${user.telegramId}`
            );
          } catch (error) {
            console.error(
              `Briefing failed for ${user.telegramId}:`,
              error.message
            );
          }
        }
      } catch (error) {
        console.error(
          "Daily briefing error:",
          error.message
        );
      }
    },
    {
      timezone
    }
  );

  console.log(
    `Daily briefing scheduled at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${timezone}`
  );
}

module.exports = {
  startScheduler
};