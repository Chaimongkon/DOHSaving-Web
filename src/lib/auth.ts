import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dohsaving-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export interface JwtPayload {
  userId: number;
  userName: string;
  userRole: string;
  fullName: string;
}

// สร้าง JWT token
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as unknown as number,
  });
}

// ตรวจสอบ JWT token
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// เปรียบเทียบ password
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ดึง token จาก request header หรือ cookie
export function getTokenFromRequest(req: NextRequest): string | null {
  // ลอง Authorization header ก่อน
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // ลอง cookie
  const token = req.cookies.get("token")?.value;
  return token || null;
}

// ตรวจสอบสิทธิ์จาก request
export function authenticateRequest(req: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
