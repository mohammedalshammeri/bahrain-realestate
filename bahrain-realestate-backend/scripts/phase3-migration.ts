import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createPhase3Tables() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

async function createPhase3Tables() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    console.log('Checking for Phase 3 tables...');

    // Create notifications table
    console.log('Creating notifications table...');
    await client`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        is_read BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✅ notifications table created');

    // Create featured_packages table
    console.log('Creating featured_packages table...');
    await client`
      CREATE TABLE IF NOT EXISTS featured_packages (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✅ featured_packages table created');

    // Create indexes
    console.log('Creating indexes...');
    await client`CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);`;
    await client`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`;
    await client`CREATE INDEX IF NOT EXISTS idx_featured_packages_property_id ON featured_packages(property_id);`;
    await client`CREATE INDEX IF NOT EXISTS idx_featured_packages_status ON featured_packages(status);`;
    await client`CREATE INDEX IF NOT EXISTS idx_featured_packages_end_date ON featured_packages(end_date);`;

    console.log('✅ Phase 3 tables migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}
}

createPhase3Tables().catch(console.error);