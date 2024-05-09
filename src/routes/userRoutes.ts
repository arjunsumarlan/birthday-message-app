import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { userValidations } from '../models/validations/userValidations';

const router = Router();
const userController = new UserController();

router.post("/", userValidations.create, userController.createUser);
router.put("/:id", userValidations.update, userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
