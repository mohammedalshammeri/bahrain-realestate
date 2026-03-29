// Test Setup - Global configuration for all tests
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables if not provided
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.AFS_API_KEY = process.env.AFS_API_KEY || 'test-afs-api-key';
process.env.AFS_MERCHANT_ID = process.env.AFS_MERCHANT_ID || 'TEST_MERCHANT_123';
process.env.AFS_RETURN_URL = process.env.AFS_RETURN_URL || 'http://localhost:3000/payment/return';
process.env.AFS_CALLBACK_URL = process.env.AFS_CALLBACK_URL || 'http://localhost:3001/api/company/payments/afs-callback';

// Increase Jest timeout for database operations
jest.setTimeout(30000);

// Global test console logging
console.log('🧪 Test environment initialized');
console.log('📊 Environment variables set for testing');
