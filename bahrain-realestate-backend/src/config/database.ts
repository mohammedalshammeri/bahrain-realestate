import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Helpful diagnostics when DB schema mismatches happen
try {
  const url = new URL(databaseUrl);
  const safeDb = (url.pathname || "").replace(/^\//, "") || "(unknown-db)";
  console.log(`✓ DB: ${url.hostname}/${safeDb} (sslmode=${url.searchParams.get("sslmode") || "n/a"})`);
} catch {
  console.log("✓ DB: (unable to parse DATABASE_URL)");
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export const db = prisma;

export default db;
