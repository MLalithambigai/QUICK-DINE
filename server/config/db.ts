import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured in environment variables');
  }

  mongoose.connection.on('connected', () => console.log('MongoDB Connected'));
  await mongoose.connect(mongoUri);
  isConnected = true;
};

export default connectDB;
