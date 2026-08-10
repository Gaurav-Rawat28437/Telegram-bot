require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("../src/config/db");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Atlas AI Backend Running..."
  });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  });