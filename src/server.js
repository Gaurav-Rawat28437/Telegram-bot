require("dotenv").config();

const dns =
  require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

const express =
  require("express");

const connectDB =
  require("./config/db");

const app =
  express();

const PORT =
  process.env.PORT || 5000;

app.use(
  express.json()
);

app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "UV-Atlas backend is running"
    });
  }
);

app.get(
  "/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      service:
        "UV-Atlas Backend",
      status: "healthy"
    });
  }
);

async function startServer() {
  try {
    await connectDB();

    app.listen(
      PORT,
      () => {
        console.log(
          "================================"
        );

        console.log(
          `Server running on port ${PORT}`
        );

        console.log(
          `http://localhost:${PORT}`
        );

        console.log(
          "================================"
        );
      }
    );
  } catch (error) {
    console.error(
      "SERVER START ERROR:",
      error.message
    );

    process.exit(1);
  }
}

startServer();