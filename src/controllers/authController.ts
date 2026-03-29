import { Request, Response } from 'express';
import { generateToken } from '../middlewares/auth';
import { IUser } from '../models/User';
import { sendSuccess, sendUnauthorized } from '../utils/apiResponse';
import { env } from '../config/env';

export function googleCallback(req: Request, res: Response): void {
  const user = req.user as IUser | undefined;

  if (!user) {
    res.redirect(`${env.clientUrl}/login?error=auth_failed`);
    return;
  }

  const token = generateToken(user);

  // Set httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Redirect to frontend with token in URL for SPA to pick up
  res.redirect(`${env.clientUrl}/auth/callback?token=${token}`);
}

export function getMe(req: Request, res: Response): void {
  const user = req.user as IUser;
  sendSuccess(res, {
    id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    credits: user.credits,
    createdAt: user.createdAt,
  });
}

export function logout(req: Request, res: Response): void {
  res.clearCookie('token');
  sendSuccess(res, null, 'Logged out successfully');
}

export function refreshToken(req: Request, res: Response): void {
  const user = req.user as IUser;
  const token = generateToken(user);

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { token }, 'Token refreshed');
}
