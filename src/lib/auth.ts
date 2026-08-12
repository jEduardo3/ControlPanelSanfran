import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type SessionUser = {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  roleCode: string | null;
  roleName: string | null;
  permissions: string[];
  mustChangePassword: boolean;
  sessionVersion: number;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error('JWT_SECRET debe existir y tener al menos 24 caracteres');
  }
  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '8h' });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}
