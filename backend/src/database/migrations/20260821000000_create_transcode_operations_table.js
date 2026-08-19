/**
 * Migration: Create transcode_operations table for auditing and lifecycle governance
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('transcode_operations');
  if (!exists) {
    await knex.schema.createTable('transcode_operations', (table) => {
      table.bigIncrements('id').primary();
      table.integer('film_id').unsigned().notNullable().index();
      table.string('job_id', 255).nullable().index();
      table.enum('operation_type', [
        'enqueue',
        'processing',
        'progress',
        'completed',
        'failed',
        'cancelled',
        'retranscode',
        'recovery',
        'reconciliation',
        'cleanup',
      ]).notNullable().index();
      table.string('previous_status', 50).nullable();
      table.string('new_status', 50).nullable();
      table.integer('progress').defaultTo(0);
      table.integer('attempt').defaultTo(1);
      table.string('reason', 255).nullable();
      table.string('error_code', 100).nullable();
      table.text('error_message').nullable();
      table.text('metadata_json').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).index();
    });
  }
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('transcode_operations');
}
