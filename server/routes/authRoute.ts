import { Router } from 'express';
import {
  getMe,
  loginUser,
  registerUser,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.get('/me', protect, getMe);

export default authRouter;
