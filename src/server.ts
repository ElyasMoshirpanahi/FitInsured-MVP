import express from 'express';
import { connectToDatabase } from './database.js';
import userRoutes from './routes/userRoutes.js';
import cors from 'cors';

const PORT = process.env.PORT || 4000;
const app = express();

// Middleware to parse JSON and handle CORS
app.use(cors());
app.use(express.json());

// Register routes
app.use(userRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Connect to database and start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check at: http://localhost:${PORT}/api/health`);
    console.log(`Signup endpoint: http://localhost:${PORT}/api/users/signup`);
  });
});