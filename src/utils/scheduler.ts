import cron from "node-cron";
import axios from "axios";
import moment from "moment-timezone";
import { delay } from "./helper";
import User, { IUser } from "../models/User";
import { MESSAGE_STATUS } from "./constants";

export const startBirthdayMessageScheduler = (): void => {
  // Cron runs every one minute
  cron.schedule("* * * * *", async () => {
    const today = new Date();
    const users = await User.find({
      birthday: {
        $dayOfMonth: today.getDate(),
        $month: today.getMonth() + 1,
      },
      $or: [
        { lastMessageSent: null },
        {
          lastMessageSent: {
            $lt: new Date(new Date().getFullYear(), 0, 1), // Less than January 1st of this year
          },
        },
      ],
    });

    // Sends birthday messages in batch processing to users at 9 AM their local time, based on the user's location and birthday
    const sendMessagePromises = users
      .filter((user) => {
        const localTime = moment().tz(user.location);
        if (
          localTime.date() === user.birthday.getDate() &&
          localTime.month() === user.birthday.getMonth() &&
          localTime.hour() === 9 &&
          localTime.minute() === 0
        ) {
          return true;
        }
      })
      .map((user) => sendBirthdayMessage(user));

    await Promise.allSettled(sendMessagePromises);
  });
};

export const sendBirthdayMessage = async (user: IUser | any): Promise<void> => {
  const maxRetries = 3;
  user.lastAttemptedSend = new Date();
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.post(`${process.env.EMAIL_SERVICE_URL}`, {
        email: user.email,
        message: `Hey, ${user.firstName} ${user.lastName}, it’s your birthday`,
      });

      if (response && response.status === 200) {
        user.lastMessageSent = new Date();
        user.messageStatus = MESSAGE_STATUS.SENT;
        await user.save();
        console.log("Message sent successfully:", response.data);
        break;
      } else {
        user.messageStatus = MESSAGE_STATUS.FAILED;
        await user.save();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      user.messageStatus = MESSAGE_STATUS.FAILED;
      await user.save();
      if (i < maxRetries - 1) {
        await delay(30000); // Wait for 30 seconds before retrying
      } else {
        console.error("Max retries reached. Giving up.");
      }
    }
  }
};

export const startRecoverUnsentMessageScheduler = (): void => {
  // Cron runs daily at midnight
  cron.schedule("0 0 * * *", async () => {
    const unsentUsers = await User.find({
      messageStatus: MESSAGE_STATUS.FAILED,
      lastAttemptedSend: {
        $lt: new Date(new Date().setDate(new Date().getDate() - 1)), // More than a day ago
      },
    });

    if (unsentUsers.length) {
      console.log(`Recovery process started for ${unsentUsers.length} users.`);
      // Sends birthday messages in batch processing
      const sendMessagePromises = unsentUsers.map((user) =>
        sendBirthdayMessage(user)
      );

      await Promise.allSettled(sendMessagePromises);
    }
  });
};
