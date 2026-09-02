import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRouter from './routes/authRoute.js';
import { NextFunction } from 'express';
import restaurantRouter from './routes/restaurantRoutes.js';

dotenv.config();

const app = express();

try {
  await connectDB();
} catch (error) {
  console.error(
    'Unable to connect to MongoDB Atlas. Check MONGODB_URI and Atlas Network Access.',
    error,
  );
  process.exit(1);
}

//Middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Server is Live!');
});

app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantRouter);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandle Error:', err);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
