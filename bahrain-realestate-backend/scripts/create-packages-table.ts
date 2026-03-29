
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const db = new PrismaClient();

async function main() {
  try {
    console.log("Starting schema update for Subscription Packages...");
    
    // Create subscription_packages table
    try {
        await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "subscription_packages" (
            "id" SERIAL PRIMARY KEY,
            "name_ar" VARCHAR(100) NOT NULL,
            "name_en" VARCHAR(100) NOT NULL,
            "price" DECIMAL(10, 2) NOT NULL DEFAULT 0,
            "duration_days" INTEGER NOT NULL DEFAULT 30,
            "ads_limit" INTEGER NOT NULL DEFAULT 0,
            "featured_ads_limit" INTEGER NOT NULL DEFAULT 0,
            "description_ar" TEXT,
            "description_en" TEXT,
            "is_active" BOOLEAN NOT NULL DEFAULT true,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        `);
        console.log("✓ Created subscription_packages table");
    } catch (e) {
        console.log("info: table might already exist or error: " + e);
    }

    // Add sample packages
    try {
        const count = await db.$queryRaw`SELECT count(*) FROM "subscription_packages"` as any[];
        if (Number(count[0].count) === 0) {
             await db.$executeRawUnsafe(`
                INSERT INTO "subscription_packages" (name_ar, name_en, price, ads_limit, featured_ads_limit, description_ar, description_en) VALUES
                ('باقة مجانية', 'Free Tier', 0, 5, 0, 'باقة تجريبية للشركات الناشئة', 'Starter package for new companies'),
                ('باقة فضية', 'Silver Package', 50, 50, 5, 'باقة مناسبة للشركات الصغيرة', 'Suitable for small businesses'),
                ('باقة ذهبية', 'Gold Package', 100, 150, 20, 'للشركات المتوسطة والكبيرة', 'For medium and large enterprises');
            `);
            console.log("✓ Added default packages");
        }
    } catch (e) {
        console.log("info: failed to add defaults: " + e);
    }

    console.log("Schema update completed successfully.");
  } catch (error) {
    console.error("Critical error updating schema:", error);
  } finally {
    await db.$disconnect();
  }
}

main();
