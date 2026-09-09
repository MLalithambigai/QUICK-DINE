import { Router } from 'express';
import { protect, adminonly } from '../middlewares/authMiddleware.js';
import {
  getAllRestaurants,
  approveRestaurant,
  getSystemStats,
} from '../controllers/adminController.js';

const adminRouter = Router();

adminRouter.use(protect);
adminRouter.use(adminonly);

adminRouter.get('/restaurants', getAllRestaurants);
adminRouter.put('/restaurants/:id/approve', approveRestaurant);
adminRouter.get('/stats', getSystemStats);

export default adminRouter;
