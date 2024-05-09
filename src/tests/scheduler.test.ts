import axios from "axios";
import MockDate from "mockdate";
import mongoose from "mongoose";
import moment from "moment-timezone";
import User from "../models/User";
import { sendBirthdayMessage } from "../utils/scheduler";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
mongoose.set('strictQuery', true);

describe("Scheduler Tests", () => {
  beforeAll(async () => {
    await mongoose.connect(`${process.env.MONGO_URI}`);
    MockDate.set(moment("2024-05-08T02:00:00Z").toDate()); // Mocking the current date to May 8th, 2024, at 9:00 AM Asia/Jakarta Time Zone
  });

  afterAll(async () => {
    await mongoose.disconnect();
    MockDate.reset();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it("should send a birthday message if today is the user's birthday", async () => {
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "test.user@gmail.com",
      location: "Asia/Jakarta",
      birthday: new Date("2024-05-08"), // User's birthday is today
    });
    await user.save();
    
    await sendBirthdayMessage(user);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${process.env.EMAIL_SERVICE_URL}`,
      {
        email: user.email,
        message: `Hey, ${user.firstName} ${user.lastName}, it’s your birthday`,
      }
    );
  });
});
