const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

const mongoose = require("mongoose");

async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGODB_URI is missing in .env"
      );
    }

    const connection =
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });

    console.log("================================");
    console.log("MongoDB Connected");
    console.log(
      "Database:",
      connection.connection.name
    );
    console.log(
      "Host:",
      connection.connection.host
    );
    console.log("================================");

    return connection;
  } catch (error) {
    console.error(
      "MongoDB connection error:",
      error.message
    );

    throw error;
  }
}

module.exports = connectDB;