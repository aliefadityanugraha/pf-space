import 'dotenv/config';
import Knex from 'knex';
import knexConfig from '../knexfile.js';

const knex = Knex(knexConfig.development);

async function listUsers() {
  try {
    const users = await knex('users').select('id', 'email', 'name', 'role_id');
    console.log('Users in database:');
    console.table(users);
    
    if (users.length === 0) {
      console.log('No users found. Try registering first.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

listUsers();
