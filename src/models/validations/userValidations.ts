import { body } from "express-validator";
import moment from "moment-timezone";

const create = [
  body("email").isEmail().withMessage("Enter a valid email address."),
  body("location").custom((value) => {
    if (value && typeof value === "string" && moment.tz.zone(value)) {
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
];

const update = [
  body("email").optional().isEmail().withMessage("Enter a valid email address."),
  body("location").optional().custom((value) => {
    if (value && typeof value === "string" && moment.tz.zone(value)) {
      return true; // Valid timezone
    } else {
      throw new Error("Invalid timezone format.");
    }
  }),
  body("birthday").optional()
    .isISO8601()
    .withMessage("Birthday must be in ISO 8601 format."),
  body("firstName").optional()
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("First name is required."),
  body("lastName").optional()
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("Last name is required."),
];

export const userValidations = { create, update };
