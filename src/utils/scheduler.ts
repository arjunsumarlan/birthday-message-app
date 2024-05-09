import cron from "node-cron";
import axios from "axios";
import moment from "moment-timezone";
import { delay } from "./helper";
import User, { IUser } from "../models/User";

export const startBirthdayMessageScheduler = (): void => {
  // Cron runs every one minute
  cron.schedule("* * * * *", async () => {
    const users = await User.find({
      $or: [
        { lastMessageSent: null },
        {
          lastMessageSent: {
            $lt: new Date(new Date().getFullYear(), 0, 1), // Less than January 1st of this year
          },
        },
      ],
    });

    for (const user of users) {
      // Sends birthday messages to users at 9 AM their local time, based on the user's location and birthday
      const localTime = moment().tz(user.location);
      if (
        localTime.date() === user.birthday.getDate() &&
        localTime.month() === user.birthday.getMonth() &&
        localTime.hour() === 9 &&
        localTime.minute() === 0
      ) {
        await sendBirthdayMessage(user);
      }
    }
  });
};

export const sendBirthdayMessage = async (user: IUser): Promise<void> => {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.post(`${process.env.EMAIL_SERVICE_URL}`, {
        email: user.email,
        message: `Hey, ${user.firstName} ${user.lastName}, it’s your birthday`,
      });

      if (response?.status === 200) {
        user.lastMessageSent = new Date();
        await user.save();
        console.log("Message sent successfully:", response.data);
      }
      break;
    } catch (error) {
      console.error("Failed to send message:", error);
      if (i < maxRetries - 1) {
        await delay(30000); // Wait for 30 seconds before retrying
      } else {
        console.error("Max retries reached. Giving up.");
      }
    }
  }
};
