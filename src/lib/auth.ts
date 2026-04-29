import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  roleCode: string | null;
  roleName: string | null;
  permissions: string[];
};

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}