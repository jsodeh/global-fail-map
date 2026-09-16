/**
 * Seed script: Create the first admin account
 * Usage: pnpm db:seed-admin
 */

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { db } from '../src/lib/db';
import { admins } from '../src/lib/db/schema';
import { hashPassword, validatePasswordStrength } from '../src/lib/auth/password';
import { eq } from 'drizzle-orm';

const rl = readline.createInterface({ input, output });

async function seedAdmin() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Progress Map - Create First Admin Account');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Check if any admins exist
    const existingAdmins = await db.select().from(admins);
    
    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin accounts already exist:');
      existingAdmins.forEach((admin, i) => {
        console.log(`   ${i + 1}. ${admin.name} (${admin.email}) - ${admin.role}`);
      });
      console.log('\n❌ Cannot create first admin - use the dashboard to create additional admins.\n');
      process.exit(1);
    }

    // Collect admin details
    console.log('Creating the first admin account...\n');
    
    const name = await rl.question('Admin name: ');
    if (!name.trim()) {
      console.log('❌ Name cannot be empty');
      process.exit(1);
    }

    const email = await rl.question('Admin email: ');
    if (!email.trim() || !email.includes('@')) {
      console.log('❌ Invalid email address');
      process.exit(1);
    }

    // Check if email already exists (shouldn't happen, but safety check)
    const existingEmail = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email.toLowerCase()));
    
    if (existingEmail.length > 0) {
      console.log('❌ An admin with this email already exists');
      process.exit(1);
    }

    // Get password with validation
    let password = '';
    let passwordValid = false;

    while (!passwordValid) {
      password = await rl.question('Password (min 8 chars, uppercase, lowercase, number): ');
      
      const validation = validatePasswordStrength(password);
      if (validation.valid) {
        passwordValid = true;
      } else {
        console.log('\n❌ Password does not meet requirements:');
        validation.errors.forEach((error) => console.log(`   - ${error}`));
        console.log('');
      }
    }

    const confirmPassword = await rl.question('Confirm password: ');
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      process.exit(1);
    }

    console.log('\n⏳ Creating admin account...');

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert admin (first admin is always super_admin)
    const [newAdmin] = await db
      .insert(admins)
      .values({
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
        role: 'super_admin',
        isActive: true,
      })
      .returning();

    console.log('\n✅ Admin account created successfully!');
    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│  Admin Details                                  │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log(`│  Name:  ${newAdmin.name.padEnd(40)} │`);
    console.log(`│  Email: ${newAdmin.email.padEnd(40)} │`);
    console.log(`│  Role:  ${newAdmin.role.padEnd(40)} │`);
    console.log('└─────────────────────────────────────────────────┘\n');
    console.log('You can now log in at /admin/login\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

seedAdmin();
