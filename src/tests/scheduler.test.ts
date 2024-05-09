import axios from "axios";
import * as cron from "node-cron";
import mongoose from "mongoose";
import * as messageModule from "../utils/scheduler";
import { delay } from "../utils/helper";
import { ScheduledTask } from "node-cron";
import { MESSAGE_STATUS } from "../utils/constants";

jest.mock("axios");

jest.mock("node-cron", () => ({
  schedule: jest
    .fn()
    .mockImplementation(
      (
        cronExpression: string,
        func: (now: Date | "manual" | "init") => void,
        options?: any
      ): ScheduledTask => {
        const mockTask: Partial<ScheduledTask> = {
          start: jest.fn(),
          stop: jest.fn(),
        };
        func(new Date());
        return mockTask as ScheduledTask;
      }
    ),
}));

jest.mock("../utils/helper", () => ({
  delay: jest.fn(() => Promise.resolve()),
}));

mongoose.set("strictQuery", true);

describe("Send Birthday Message Tests", () => {
  const user = {
    email: "test.user@gmail.com",
    firstName: "Test",
    lastName: "User",
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("successfully sends a birthday message", async () => {
    const mockUser = {
      email: "test.user@gmail.com",
      firstName: "Test",
      lastName: "User",
      save: jest.fn(() => Promise.resolve()),
    };

    (axios.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: "Message sent",
    });

    await messageModule.sendBirthdayMessage(mockUser);

    expect(axios.post).toHaveBeenCalledWith(
      `${process.env.EMAIL_SERVICE_URL}`,
      {
        email: mockUser.email,
        message: `Hey, Test User, it’s your birthday`,
      }
    );
    expect(mockUser.save).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      "Message sent successfully:",
      "Message sent"
    );
  });

  it('sets message status to FAILED on unsuccessful HTTP status', async () => {
    const mockUser = {
      email: 'test.user@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      messageStatus: MESSAGE_STATUS.PENDING,
      save: jest.fn()
    };
  
    (axios.post as jest.Mock).mockResolvedValue({ status: 404, data: 'Not Found' });  // Simulate a non-200 status
  
    await messageModule.sendBirthdayMessage(mockUser);
  
    expect(mockUser.messageStatus).toBe(MESSAGE_STATUS.FAILED);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it("handles exceptions during the API call", async () => {
    const mockUser = {
      email: "test.user@gmail.com",
      firstName: "Test",
      lastName: "User",
      messageStatus: MESSAGE_STATUS.PENDING,
      save: jest.fn(() => Promise.resolve()),
    };

    // Simulate an error thrown by axios
    (axios.post as jest.Mock).mockRejectedValue(new Error("Network Error"));

    await messageModule.sendBirthdayMessage(mockUser);

    expect(mockUser.messageStatus).toBe(MESSAGE_STATUS.FAILED);
    expect(axios.post).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Failed to send message:",
      expect.any(Error)
    );
  });

  it("successfully sends a message on the first try", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: "Message sent",
    });

    await messageModule.sendBirthdayMessage(user);

    expect(axios.post as jest.Mock).toHaveBeenCalledTimes(1);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      "Message sent successfully:",
      "Message sent"
    );
  });

  it("successfully sends a message on a retry", async () => {
    (axios.post as jest.Mock)
      .mockRejectedValueOnce(new Error("Failed to send"))
      .mockResolvedValueOnce({ status: 200, data: "Message sent" });

    await messageModule.sendBirthdayMessage(user);

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(user.save).toHaveBeenCalledTimes(2); // save will called twice to make sure message status was stored
    expect(delay).toHaveBeenCalledWith(30000);
  });

  it("gives up after max retries", async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error("Failed to send"));

    await messageModule.sendBirthdayMessage(user);

    expect(axios.post).toHaveBeenCalledTimes(3);
    expect(user.save).toHaveBeenCalled();
    expect(delay).toHaveBeenCalledTimes(2); // Delay should be called twice
    expect(console.error).toHaveBeenCalledWith(
      "Max retries reached. Giving up."
    );
  });
});

jest.mock("moment-timezone", () => () => ({
  tz: () => ({
    date: () => 1, // First day of the month
    month: () => 0, // January
    hour: () => 9,
    minute: () => 0,
  }),
}));

describe("Birthday Message Scheduler Tests", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest
      .spyOn(messageModule, "sendBirthdayMessage")
      .mockImplementation(() => Promise.resolve());
  });

  it("schedules and triggers sending birthday messages", async () => {
    messageModule.startBirthdayMessageScheduler();

    expect(cron.schedule).toHaveBeenCalledWith(
      "* * * * *",
      expect.any(Function)
    );

    // Execute the scheduled function directly
    const scheduledFunction = (cron.schedule as jest.Mock).mock.calls[0][1];
    await scheduledFunction(); // Manually trigger the cron job function

    expect(messageModule.sendBirthdayMessage).toHaveBeenCalled();
  });
});

jest.mock("../models/User", () => ({
  find: jest.fn().mockResolvedValue([
    {
      _id: "1",
      email: "user1@gmail.com",
      firstName: "User",
      lastName: "Test",
      birthday: new Date("2023-01-01T09:00:00Z"),
      location: "Asia/Jakarta",
      lastMessageSent: null,
      messageStatus: "failed",
    },
    {
      _id: "2",
      email: "user2@gmail.com",
      firstName: "User",
      lastName: "Test",
      birthday: new Date("2023-01-01T09:00:00Z"),
      location: "Asia/Jakarta",
      lastMessageSent: null,
      messageStatus: "pending",
    },
  ]),
}));

describe("Recovery of unsent messages Scheduler Tests", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest
      .spyOn(messageModule, "sendBirthdayMessage")
      .mockImplementation(() => Promise.resolve());
  });

  it("should attempt to resend unsent messages", async () => {
    await messageModule.startRecoverUnsentMessageScheduler();

    expect(messageModule.sendBirthdayMessage).toHaveBeenCalledTimes(2);
    expect(messageModule.sendBirthdayMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ email: "user1@gmail.com" })
    );
    expect(messageModule.sendBirthdayMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ email: "user2@gmail.com" })
    );
  });
});
