import mongoose from 'mongoose';

const connectDB = async () => {
  mongoose.connection.on('connected', () => console.log('MongoDB Connected'));
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured in server/.env');
  }

  await mongoose.connect(mongoUri);
};

export default connectDB;
