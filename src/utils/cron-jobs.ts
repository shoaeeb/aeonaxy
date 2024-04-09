import cron from "node-cron";
import AppDataSource from "../DataSource/app-data-source";
import { OTPHolder } from "../models/OtpHolder";

export function startCronJobs() {
  cron.schedule("* * * * *", async () => {
    try {
      const expiryDate = new Date(Date.now() - 1000 * 60 * 3); //3 minutes
      await AppDataSource.getRepository(OTPHolder)
        .createQueryBuilder()
        .delete()
        .where("createdAt <:expiryDate", { expiryDate })
        .execute();
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });
}
