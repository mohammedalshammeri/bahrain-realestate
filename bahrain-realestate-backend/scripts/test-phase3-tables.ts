import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPhase3Tables() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    console.log('Testing Phase 3 tables...');

    // Test notifications table
    try {
      const notifications = await db.select().from(schema.notifications).limit(1);
      console.log('✅ notifications table exists');
    } catch (error) {
      console.log('❌ notifications table does not exist');
    }

    // Test featured_packages table
    try {
      const featuredPackages = await db.select().from(schema.featuredPackages).limit(1);
      console.log('✅ featured_packages table exists');
    } catch (error) {
      console.log('❌ featured_packages table does not exist');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.end();
  }
}

testPhase3Tables().catch(console.error);