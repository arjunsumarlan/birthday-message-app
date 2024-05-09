import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import User from "../models/User";

mongoose.set("strictQuery", true);

describe("User API", () => {
  beforeAll(async () => {
    await mongoose.connect(`${process.env.MONGO_URI}`);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test("POST /user should create a new user without a lastMessageSent", async () => {
    const userData = {
      firstName: "Test",
      lastName: "User",
      email: "test.user@gmail.com",
      birthday: "1990-01-01T00:00:00.000Z",
      location: "Asia/Jakarta",
    };

    const response = await request(app).post("/user").send(userData);
    expect(response.status).toBe(201);
    expect(response.body.firstName).toEqual(userData.firstName);
    expect(response.body.lastMessageSent).toBeNull();
  });

  test("PUT /user/:id should update user details and manage lastMessageSent correctly", async () => {
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "test.user@gmail.com",
      birthday: new Date("1990-06-01"),
      location: "Asia/Jakarta",
      lastMessageSent: new Date("2022-06-01"), // Suppose the message was sent last year
    });
    await user.save();

    const today = new Date();
    const nextYear = today.getFullYear() + 1;
    const updatedData = {
      birthday: new Date(`${nextYear}-06-01`).toISOString(),
    }; // Updating to next year's birthday

    const response = await request(app)
      .put(`/user/${user._id}`)
      .send(updatedData);
    expect(response.status).toBe(200);
    expect(new Date(response.body.birthday)).toEqual(
      new Date(updatedData.birthday)
    );
    expect(response.body.lastMessageSent).toBeNull(); // Should be reset because the new birthday has not occurred yet this year
  });

  it("PUT /user/:id should update user's birthday and reset lastMessageSent if necessary", async () => {
    const user = await User.create({
      firstName: "Test",
      lastName: "User",
      email: "test.user@gmail.com",
      birthday: new Date("1990-06-01"),
      location: "Asia/Jakarta",
      lastMessageSent: new Date(new Date().getFullYear() - 1, 5, 1), // Last year
    });

    const nextYear = new Date().getFullYear() + 1;
    const response = await request(app)
      .put(`/user/${user._id}`)
      .send({
        birthday: new Date(nextYear, 5, 1), // June 1st, next year
      });

    expect(response.status).toBe(200);
    expect(response.body.lastMessageSent).toBeNull();
  });

  test("DELETE /user/:id should delete a user", async () => {
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "test.user@gmail.com",
      birthday: "1989-03-01",
      location: "Asia/Jakarta",
    });
    await user.save();

    const response = await request(app).delete(`/user/${user._id}`);
    expect(response.status).toBe(200);
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });
});

describe("User API Errors", () => {
  beforeAll(async () => {
    await mongoose.connect(`${process.env.MONGO_URI}`);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await User.deleteMany({});
    jest.restoreAllMocks();
  });

  test("POST /user should validate user data", async () => {
    const response = await request(app).post("/user").send({
      email: "wrong-email",
      location: "invalid-location",
      birthday: "20231035", // Incorrect format
      firstName: "", // Empty
      lastName: "", // Empty
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(5); // Check for five validation errors
  });

  it("POST /user should handle save errors gracefully", async () => {
    User.prototype.save = jest.fn().mockImplementation(() => {
      throw new Error("Database save error");
    });
    
    const response = await request(app)
      .post("/user")
      .send({
        firstName: "Test",
        lastName: "User",
        email: "test.user@gmail.com",
        birthday: new Date("1990-06-01"),
        location: "Asia/Jakarta",
        lastMessageSent: new Date("2022-06-01"),
      });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error", "Database save error");
  });

  it("PUT /user/:id should return 404 for updating non-existent user", async () => {
    const res = await request(app).put("/user/123456789012").send({
      firstName: "Nonexistent",
    });
    expect(res.statusCode).toEqual(404);
  });

  it("PUT /user/:id should handle save errors gracefully", async () => {
    User.prototype.save = jest.fn().mockImplementation(() => {
      throw new Error("Database save error");
    });

    const user = await User.create({
      firstName: "Test",
      lastName: "User",
      email: "test.user@gmail.com",
      birthday: new Date("1990-06-01"),
      location: "Asia/Jakarta"
    });

    const response = await request(app)
      .put(`/user/${user._id}`)
      .send({
        lastName: "UserEdit"
      });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error", "Database save error");
  });

  it("DELETE /user/:id should return 404 for deleting non-existent user", async () => {
    const res = await request(app).delete("/user/123456789012").send();
    expect(res.statusCode).toEqual(404);
  });
  
  it("DELETE /user/:id should handle save errors gracefully", async () => {
    const user = await User.create({
      firstName: "Test",
      lastName: "User",
      email: "test.user@gmail.com",
      birthday: new Date("1990-06-01"),
      location: "Asia/Jakarta"
    });

    User.findByIdAndDelete = jest.fn().mockImplementation((id) => {
      throw new Error("Database error");
    });

    const response = await request(app)
      .delete(`/user/${user._id}`)
      .send();

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error", "Database error");
  });
});
