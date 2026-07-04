export async function up(knex) {
  // Roles table
  await knex.schema.createTable('roles', (table) => {
    table.increments('role_id').primary();
    table.string('name').notNullable().unique();
    table.text('description').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Seed default roles
  await knex('roles').insert([
    { role_id: 1, name: 'user', description: 'Default user - can vote and comment' },
    { role_id: 2, name: 'creator', description: 'Can upload and manage own films' },
    { role_id: 3, name: 'moderator', description: 'Can moderate comments and discussions' },
    { role_id: 4, name: 'admin', description: 'Full access to all features' }
  ]);

  // Users table - Better Auth schema (camelCase)
  await knex.schema.createTable('users', (table) => {
    table.string('id', 36).primary();
    table.string('email').notNullable().unique();
    table.string('name').notNullable();
    table.boolean('emailVerified').defaultTo(false);
    table.string('image').nullable();
    table.integer('role_id').unsigned().defaultTo(1);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('role_id').references('role_id').inTable('roles');
  });

  // Sessions table - Better Auth schema
  await knex.schema.createTable('sessions', (table) => {
    table.string('id', 36).primary();
    table.string('userId', 36).notNullable();
    table.string('token').notNullable().unique();
    table.timestamp('expiresAt').notNullable();
    table.string('ipAddress').nullable();
    table.string('userAgent').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
  });

  // Accounts table - Better Auth schema
  await knex.schema.createTable('accounts', (table) => {
    table.string('id', 36).primary();
    table.string('userId', 36).notNullable();
    table.string('accountId').notNullable();
    table.string('providerId').notNullable();
    table.string('accessToken').nullable();
    table.string('refreshToken').nullable();
    table.timestamp('accessTokenExpiresAt').nullable();
    table.timestamp('refreshTokenExpiresAt').nullable();
    table.string('scope').nullable();
    table.text('idToken').nullable();
    table.string('password').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
  });

  // Verifications table - Better Auth schema
  await knex.schema.createTable('verifications', (table) => {
    table.string('id', 36).primary();
    table.string('identifier').notNullable();
    table.string('value').notNullable();
    table.timestamp('expiresAt').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('verifications');
  await knex.schema.dropTableIfExists('accounts');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('roles');
}
