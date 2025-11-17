import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://hugo136875_db_user:vebeb7kJlmRidrHa@cluster-fi5.t5kaizv.mongodb.net/FitInsured?appName=Cluster-fi5';

let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if unable to connect
  }
};