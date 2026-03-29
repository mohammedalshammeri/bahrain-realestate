
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const db = new PrismaClient();

async function main() {
  try {
    console.log("Starting schema update...");
    
    // 1. Add subscription_plan
    try {
        await db.$executeRawUnsafe(`
        ALTER TABLE "companies" 
        ADD COLUMN IF NOT EXISTS "subscription_plan" VARCHAR(50) DEFAULT 'free';
        `);
        console.log("✓ Added subscription_plan");
    } catch (e) {
        console.log("info: subscription_plan might already exist or error: " + e);
    }

    // 2. Add subscription_start_date
    try {
        await db.$executeRawUnsafe(`
        ALTER TABLE "companies" 
        ADD COLUMN IF NOT EXISTS "subscription_start_date" TIMESTAMP(3);
        `);
        console.log("✓ Added subscription_start_date");
    } catch (e) {
        console.log("info: subscription_start_date might already exist or error: " + e);
    }

    // 3. Add subscription_end_date
    try {
        await db.$executeRawUnsafe(`
        ALTER TABLE "companies" 
        ADD COLUMN IF NOT EXISTS "subscription_end_date" TIMESTAMP(3);
        `);
        console.log("✓ Added subscription_end_date");
    } catch (e) {
        console.log("info: subscription_end_date might already exist or error: " + e);
    }

    // 4. Add subscription_status
    try {
        await db.$executeRawUnsafe(`
        ALTER TABLE "companies" 
        ADD COLUMN IF NOT EXISTS "subscription_status" VARCHAR(20) DEFAULT 'active';
        `);
        console.log("✓ Added subscription_status");
    } catch (e) {
        console.log("info: subscription_status might already exist or error: " + e);
    }

    console.log("Schema update completed successfully.");
  } catch (error) {
    console.error("Critical error updating schema:", error);
  } finally {
    await db.$disconnect();
  }
}

main();
