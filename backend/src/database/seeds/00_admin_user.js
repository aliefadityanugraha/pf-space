import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  // Better Auth uses a 16-byte random salt, converted to hex
  const salt = crypto.randomBytes(16).toString('hex');
  // Better Auth uses r: 16, N: 16384 for scrypt
  // The salt used in the scrypt function is the hex string itself
  const hash = await scryptAsync(password, salt, 64, { 
    N: 16384, 
    r: 16, 
    p: 1,
    maxmem: 64 * 1024 * 1024 // 64MB to be safe
  });
  return `${salt}:${hash.toString('hex')}`;
}

export async function seed(knex) {
  const email = 'admin@pfspace.com';
  const password = 'admin123';
  const name = 'Admin PF Space';
  const role_id = 4; // admin role

  const hashedPassword = await hashPassword(password);
  
  // Check if admin already exists
  let user = await knex('users').where({ email }).first();
  let userId;

  if (user) {
    console.log('Admin user exists, updating...');
    userId = user.id;
    await knex('users').where({ id: userId }).update({
      name,
      role_id,
      updatedAt: knex.fn.now()
    });
  } else {
    console.log('Creating new admin user...');
    userId = crypto.randomUUID();
    await knex('users').insert({
      id: userId,
      email,
      name,
      emailVerified: true,
      role_id,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now()
    });
  }

  // Handle Account (Password)
  const existingAccount = await knex('accounts')
    .where({ userId, providerId: 'credential' })
    .first();

  if (existingAccount) {
    await knex('accounts')
      .where({ id: existingAccount.id })
      .update({
        accountId: userId, // Better Auth uses userId as accountId for credential provider
        password: hashedPassword,
        updatedAt: knex.fn.now()
      });
  } else {
    await knex('accounts').insert({
      id: crypto.randomUUID(),
      userId: userId,
      accountId: userId, // Better Auth uses userId as accountId for credential provider
      providerId: 'credential',
      password: hashedPassword,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now()
    });
  }

  console.log('✅ Admin user sync complete:');
  console.log('   Email: ' + email);
  console.log('   Password: ' + password);
}
