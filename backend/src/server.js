import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ENV } from "./config/env.js";
import { seedDatabase } from "./seeder.js";

const startServer = async () => {
  await connectDB();
  await seedDatabase();

  app.listen(ENV.PORT, () => {
    console.log(`Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
  });
};

startServer();
