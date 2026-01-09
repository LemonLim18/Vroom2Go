import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Generate JWT
const generateToken = (id: number, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: role || 'OWNER',
      },
    });

    // Create Shop entry if role is SHOP
    if (user.role === 'SHOP') {
      await prisma.shop.create({
        data: {
          userId: user.id,
          name: `${user.name}'s Shop`, // Default name, can be updated later
          address: 'Update your address',
        }
      });
    }

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    // Simulate lookup delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // We don't reveal if user exists for security, but we'll log it for 'dev' purposes
    const user = await prisma.user.findUnique({ where: { email } });
    console.log(`[Forgot Password] Request for ${email}. Exists: ${!!user}`);

    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
