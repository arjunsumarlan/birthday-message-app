import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { UserService } from '../services/UserService';

const userService = new UserService();

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = await userService.createUser(req.body);
      res.status(201).send(user);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).send("User not found");
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const user = await userService.deleteUser(req.params.id);
      if (!user) {
        return res.status(404).send("User not found");
      }
      res.send(user);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }
}
