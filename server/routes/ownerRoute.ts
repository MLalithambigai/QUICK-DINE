import { Router } from 'express';
import {
  getOwnerRestaurant,
  createOwnerRestaurant,
  updateOwnerRestaurant,
  getOwnerBookings,
  updateBookingStatus,
} from '../controllers/ownerController.js';
import { protect, owneronly } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const ownerRouter = Router();

ownerRouter.use(protect);
ownerRouter.use(owneronly);

ownerRouter.get('/restaurant', getOwnerRestaurant);
ownerRouter.post('/restaurant', upload.single('image'), createOwnerRestaurant);
ownerRouter.put(
  '/restaurant/:id',
  upload.single('image'),
  updateOwnerRestaurant,
);
ownerRouter.get('/bookings', getOwnerBookings);
ownerRouter.put('/bookings/:id/status', updateBookingStatus);

export default ownerRouter;
