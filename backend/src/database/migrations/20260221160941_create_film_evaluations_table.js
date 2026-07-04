/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('film_evaluations', (table) => {
    table.increments('id').primary()
    table.integer('film_id').unsigned().references('film_id').inTable('films').onDelete('CASCADE').notNullable()
    table.string('moderator_id').references('id').inTable('users').onDelete('SET NULL')
    
    // Objective Scores & Comments
    table.integer('script_score').defaultTo(0)
    table.text('script_comment')
    
    table.integer('cinematography_score').defaultTo(0)
    table.text('cinematography_comment')
    
    table.integer('editing_score').defaultTo(0)
    table.text('editing_comment')
    
    table.integer('production_score').defaultTo(0)
    table.text('production_comment')
    
    table.text('overall_feedback')
    
    table.timestamps(true, true)
    
    // Unique rating per film (one master evaluation, could be updated)
    table.unique(['film_id'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('film_evaluations')
}
