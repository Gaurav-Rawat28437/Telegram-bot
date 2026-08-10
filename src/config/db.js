const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB Connected");
    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

    const collections =
      await mongoose.connection.db
        .listCollections()
        .toArray();

    console.log(
      "Collections:",
      collections.map((item) => item.name)
    );

  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
}

module.exports = connectDB;