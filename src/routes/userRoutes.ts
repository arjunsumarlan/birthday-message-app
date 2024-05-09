import { Router, Request, Response } from 'express';
import moment from 'moment';
import User from '../models/User';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    try {
        const user = new User({ ...req.body, lastMessageSent: null });
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const { birthday, firstName, email, lastName, location } = req.body;
        const newBirthday = birthday ? new Date(birthday) : user.birthday;
        
        // Reset lastMessageSent if the new birthday for the current year hasn't passed yet
        if (newBirthday && user.lastMessageSent) {
            const newBirthdayThisYear = moment(newBirthday).year(moment().year());
            const lastMessageDate = moment(user.lastMessageSent);

            if (newBirthdayThisYear.isAfter(moment()) && lastMessageDate.isBefore(newBirthdayThisYear)) {
                user.lastMessageSent = null;
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
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send(error);
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

export default router;
