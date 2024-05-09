import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import moment from "moment";
import User from "../models/User";
import { MESSAGE_STATUS } from "../utils/constants";

const router = Router();

router.post(
  "/",
  [
    body("email").isEmail().withMessage("Enter a valid email address."),
    body("location").custom((value) => {
      if (
        value &&
        typeof value === "string" &&
        require("moment-timezone").tz.zone(value)
      ) {
        return true; // Valid timezone
      } else {
        throw new Error("Invalid timezone format.");
      }
    }),
    body("birthday")
      .isISO8601()
      .withMessage("Birthday must be in ISO 8601 format."),
    body("firstName")
      .not()
      .isEmpty()
      .trim()
      .escape()
      .withMessage("First name is required."),
    body("lastName")
      .not()
      .isEmpty()
      .trim()
      .escape()
      .withMessage("Last name is required."),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = new User({
        ...req.body,
        lastMessageSent: null,
        lastAttemptedSend: null,
        messageStatus: MESSAGE_STATUS.PENDING,
      });
      await user.save();
      res.status(201).send(user);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }
);

router.put("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { birthday, firstName, email, lastName, location } = req.body;
    const newBirthday = birthday ? new Date(birthday) : user.birthday;

    // Reset lastMessageSent if the new birthday for the current year hasn't passed yet
    if (newBirthday && user.lastMessageSent) {
      const newBirthdayThisYear = moment(newBirthday).year(moment().year());
      const lastMessageDate = moment(user.lastMessageSent);

      if (
        newBirthdayThisYear.isAfter(moment()) &&
        lastMessageDate.isBefore(newBirthdayThisYear)
      ) {
        user.lastMessageSent = null;
        user.lastAttemptedSend = null;
        user.messageStatus = MESSAGE_STATUS.PENDING;
      }
    }

    // Updating other fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.birthday = newBirthday;
    user.location = location || user.location;

    await user.save();
    res.json(user);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.send(user);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
});

export default router;
