/**
 * Script to promote a user to admin role
 * Usage: node scripts/make-admin.js <email>
 * 
 * Example: node scripts/make-admin.js user@example.com
 */

import knex from 'knex';
import knexConfig from '../knexfile.js';

const db = knex(knexConfig.development);

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: node scripts/make-admin.js <email>');
    console.log('Example: node scripts/make-admin.js user@example.com');
    process.exit(1);
  }

  try {
    // Find user by email
    const user = await db('users').where('email', email).first();

    if (!user) {
      console.log(`❌ User with email "${email}" not found.`);
      console.log('\nAvailable users:');
      const users = await db('users').select('email', 'name', 'role_id');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.name}) - role_id: ${u.role_id}`);
      });
      process.exit(1);
    }

    // Update role to admin (role_id: 4)
    await db('users').where('email', email).update({ role_id: 4 });

    console.log(`✅ User "${user.name}" (${email}) has been promoted to admin!`);
    console.log(`   Previous role_id: ${user.role_id}`);
    console.log(`   New role_id: 4 (admin)`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.destroy();
  }
}

makeAdmin();
