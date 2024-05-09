import User from "../models/User";
import { MESSAGE_STATUS } from "../utils/constants";
import moment from "moment";

export class UserService {
  async createUser(userData: any) {
    const user = new User({
      ...userData,
      lastMessageSent: null,
      lastAttemptedSend: null,
      messageStatus: MESSAGE_STATUS.PENDING,
    });
    await user.save();
    return user;
  }

  async updateUser(userId: string, updateData: any) {
    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    const { birthday, firstName, email, lastName, location } = updateData;
    const newBirthday = birthday ? new Date(birthday) : user.birthday;

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

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.birthday = newBirthday;
    user.location = location || user.location;

    await user.save();
    return user;
  }

  async deleteUser(userId: string) {
    const user = await User.findByIdAndDelete(userId);
    return user;
  }
}
