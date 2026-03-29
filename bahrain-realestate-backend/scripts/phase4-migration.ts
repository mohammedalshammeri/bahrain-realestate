import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createPhase4Tables() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    console.log('Creating Phase 4 tables for payments and growth features...');

    // Create enhanced_payments table
    console.log('Creating enhanced_payments table...');
    await client`
      CREATE TABLE IF NOT EXISTS enhanced_payments (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        company_id INTEGER NOT NULL,
        amount DECIMAL(10,3) NOT NULL,
        currency VARCHAR(3) DEFAULT 'BHD' NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        gateway VARCHAR(50) NOT NULL,
        gateway_transaction_id VARCHAR(255),
        gateway_response TEXT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✅ enhanced_payments table created');

    // Create payment_items table (for linking payments to featured packages/boosts)
    console.log('Creating payment_items table...');
    await client`
      CREATE TABLE IF NOT EXISTS payment_items (
        id SERIAL PRIMARY KEY,
        payment_id INTEGER NOT NULL REFERENCES enhanced_payments(id) ON DELETE CASCADE,
        item_type VARCHAR(50) NOT NULL, -- 'featured_package', 'boost', etc.
        item_id INTEGER NOT NULL, -- ID of the featured package or boost
        amount DECIMAL(10,3) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✅ payment_items table created');

    // Create boosts table
    console.log('Creating boosts table...');
    await client`
      CREATE TABLE IF NOT EXISTS boosts (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        boost_type VARCHAR(20) DEFAULT 'priority' NOT NULL,
        duration INTEGER NOT NULL, -- in days
        amount DECIMAL(10,3) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        payment_id INTEGER REFERENCES enhanced_payments(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✅ boosts table created');

    // Create push_tokens table for push notifications
    console.log('Creating push_tokens table...');
    await client`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) NOT NULL,
        device_type VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
        user_type VARCHAR(20) NOT NULL, -- 'company', 'employee', 'admin'
        user_id INTEGER,
        company_id INTEGER,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        last_used TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(token, user_type, user_id)
      );
    `;
    console.log('✅ push_tokens table created');

    // Create push_notifications table for tracking sent notifications
    console.log('Creating push_notifications table...');
    await client`
      CREATE TABLE IF NOT EXISTS push_notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        data TEXT,
        user_type VARCHAR(20) NOT NULL, -- 'company', 'employee', 'admin'
        user_id INTEGER,
        company_id INTEGER,
        sent_at TIMESTAMP,
        success_count INTEGER DEFAULT 0 NOT NULL,
        failure_count INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✅ push_notifications table created');

    // Create indexes
    console.log('Creating indexes...');
    await client`CREATE INDEX IF NOT EXISTS idx_enhanced_payments_company_id ON enhanced_payments(company_id);`;
    await client`CREATE INDEX IF NOT EXISTS idx_enhanced_payments_status ON enhanced_payments(status);`;
    await client`CREATE INDEX IF NOT EXISTS idx_enhanced_payments_transaction_id ON enhanced_payments(transaction_id);`;
    await client`CREATE INDEX IF NOT EXISTS idx_payment_items_payment_id ON payment_items(payment_id);`;
    await client`CREATE INDEX IF NOT EXISTS idx_boosts_property_id ON boosts(property_id);`;
    await client`CREATE INDEX IF NOT EXISTS idx_boosts_company_id ON boosts(company_id);`;
    await client`CREATE INDEX IF NOT EXISTS idx_boosts_is_active ON boosts(is_active);`;
    await client`CREATE INDEX IF NOT EXISTS idx_boosts_end_date ON boosts(end_date);`;
    await client`CREATE INDEX IF NOT EXISTS idx_push_tokens_company_id ON push_tokens(company_id);`;
    await client`CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);`;
    await client`CREATE INDEX IF NOT EXISTS idx_push_tokens_user_type ON push_tokens(user_type);`;
    await client`CREATE INDEX IF NOT EXISTS idx_push_notifications_company_id ON push_notifications(company_id);`;
    await client`CREATE INDEX IF NOT EXISTS idx_push_notifications_user_type ON push_notifications(user_type);`;

    console.log('✅ Phase 4 tables migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createPhase4Tables().catch(console.error);