import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import crypto from 'crypto';

const router = Router();

// POST /api/users/signup
router.post('/api/users/signup', async (req: Request, res: Response) => {
  try {
    const { displayName, email, password, primaryProvider, personaId } = req.body;

    // Basic validation
    if (!displayName || !email || !password) {
      return res.status(400).json({
        error: 'Display name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate userId
    const userId = crypto.randomUUID();

    // Create new user
    const newUser = new User({
      userId,
      displayName,
      email,
      passwordHash,
      primaryProvider,
      personaId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save user to database
    await newUser.save();

    // Return success response (without passwordHash)
    return res.status(201).json({
      userId: newUser.userId,
      displayName: newUser.displayName,
      email: newUser.email,
      primaryProvider: newUser.primaryProvider,
      personaId: newUser.personaId,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;