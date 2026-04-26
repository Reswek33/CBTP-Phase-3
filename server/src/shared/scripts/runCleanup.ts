import cron from "node-cron";
import { cleanupDatabase } from "../utils/cleanup.js";

cron.schedule("0 * * * *", async () => {
  try {
    await cleanupDatabase();
  } catch (err) {
    console.error("Cleanup task failed:", err);
  }
});
