/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.table('films', (table) => {
    table.renameColumn('filosofi_poster', 'deskripsi_lengkap');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.table('films', (table) => {
    table.renameColumn('deskripsi_lengkap', 'filosofi_poster');
  });
};
