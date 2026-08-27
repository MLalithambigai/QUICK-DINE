import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
