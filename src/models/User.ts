import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    birthday: Date;
    location: string;
    lastMessageSent: Date | null;
}

const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    birthday: { type: Date, required: true },
    location: { type: String, required: true },
    lastMessageSent: { type: Date } 
});

const User = model<IUser>('User', userSchema);
export default User;
