/**
 * Database Connection Test Script
 * Tests the Mongoose connection with retry logic
 */

import {
  connectDatabase,
  disconnectDatabase,
  setupConnectionEventHandlers,
  getConnectionState,
  isConnected,
  getPoolStats,
} from './config/database.config';

/**
 * Main test function
 */
async function testDatabaseConnection(): Promise<void> {
  console.log('='.repeat(60));
  console.log('DATABASE CONNECTION TEST');
  console.log('='.repeat(60));
  console.log();

  try {
    // Set up event handlers
    console.log('📋 Setting up connection event handlers...');
    setupConnectionEventHandlers();
    console.log();

    // Attempt connection
    console.log('🚀 Starting connection test...');
    await connectDatabase();
    console.log();

    // Check connection state
    console.log('📊 Connection Status:');
    console.log(`   State: ${getConnectionState()}`);
    console.log(`   Connected: ${isConnected()}`);
    console.log();

    // Get pool statistics
    console.log('📊 Connection Pool Statistics:');
    const stats = getPoolStats();
    console.log(`   State: ${stats.state}`);
    console.log(`   Host: ${stats.host || 'N/A'}`);
    console.log(`   Database: ${stats.name || 'N/A'}`);
    console.log();

    // Wait a moment to see event handlers in action
    console.log('⏳ Waiting 2 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log();

    // Disconnect
    console.log('🔌 Disconnecting...');
    await disconnectDatabase();
    console.log();

    console.log('='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }

    process.exit(1);
  }
}

// Run the test
testDatabaseConnection();
