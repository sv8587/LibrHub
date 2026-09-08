import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User';
import { isDbConnected, getInMemoryUsers } from '../services/store';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'librhub_jwt_secure_secret_key_2026_super_secure';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername?.trim() || !password?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email/username and password',
        });
      }

      const input = emailOrUsername.trim().toLowerCase();
      let user: any = null;

      if (isDbConnected()) {
        user = await UserModel.findOne({
          $or: [{ email: input }, { username: input }],
        });
      } else {
        user = getInMemoryUsers().find(
          (u) => u.email.toLowerCase() === input || u.username.toLowerCase() === input
        );
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Librarian account not found.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password. Please check your credentials.',
        });
      }

      const tokenPayload = {
        id: user._id ? user._id.toString() : user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        token,
        user: tokenPayload,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Login failed',
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      res.json({
        success: true,
        user: req.user,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const authController = new AuthController();
export default authController;
