/**
 * Quick database connection test
 */

import { db } from '../src/lib/db';
import { admins, projects } from '../src/lib/db/schema';

async function testConnection() {
  try {
    console.log('Testing database connection...\n');

    // Test 1: Count tables
    const adminCount = await db.select().from(admins);
    const projectCount = await db.select().from(projects);

    console.log('✅ Connection successful!');
    console.log(`   - Admins: ${adminCount.length} rows`);
    console.log(`   - Projects: ${projectCount.length} rows`);

    console.log('\n✅ Database ready for Phase 4 (Admin Authentication)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

testConnection();
