import { Request } from 'express';
import { Role } from '@prisma/client';

export type AuthUser = {
  sub: string;
  email: string;
  role: Role;
  csrf: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthUser;
  authSource?: 'cookie' | 'bearer';
};
