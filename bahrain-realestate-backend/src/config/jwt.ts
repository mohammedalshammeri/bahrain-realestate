import jwt, { Secret } from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  console.warn("⚠️  WARNING: JWT_SECRET is not set! Using fallback. Set JWT_SECRET in .env for production.");
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || (() => { throw new Error("FATAL: JWT_SECRET environment variable is required"); })();
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

export const generateToken = (payload: object, expiresIn?: string | number) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn || JWT_EXPIRE,
  } as any);
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

export const decodeToken = (token: string) => {
  return jwt.decode(token);
};
