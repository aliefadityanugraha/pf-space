/**
 * src/database/index.js
 * 
 * Module for initializing database connection using Knex.js and Objection.js.
 * Links Knex.js instance with Objection.js models.
 */

import Knex from 'knex';
import { Model } from 'objection';
import knexConfig from '../../knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const knex = Knex(knexConfig[environment]);

/**
 * Initialize database connection and attach it to Objection.js models
 * @returns {Promise<void>}
 */
export const initDatabase = async () => {
  Model.knex(knex);
  console.log('Database connected');
};

export { knex };
