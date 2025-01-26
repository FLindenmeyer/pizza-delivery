import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pizza-delivery-secret-key';
const JWT_EXPIRATION = '7d';

// Fixed credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@pizzadelivery.com',
  password: 'admin123'
};

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: ADMIN_CREDENTIALS.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.json({ token });
  }
} 