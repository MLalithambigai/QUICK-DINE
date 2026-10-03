import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRouter from './routes/authRoute.js';
import { NextFunction } from 'express';
import restaurantRouter from './routes/restaurantRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import ownerRouter from './routes/ownerRoute.js';
import adminRouter from './routes/adminRoutes.js';

const app = express();

// Eagerly initiate database connection
connectDB().catch((error) => {
  console.error('Unable to connect to MongoDB Atlas:', error);
});

// Middleware
app.use(
  cors({
    origin: true, // Allow request origin dynamically, including https://quick-dine-h554-rho.vercel.app
    credentials: true,
  }),
);
app.use(express.json());

// Ensure DB is connected for API requests in serverless environments
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error during request:', error);
    res.status(500).json({
      message: 'Database connection failed. Please ensure MONGODB_URI is set and IP access is enabled.',
    });
  }
});

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Server is Live!');
});

app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

export default app;
