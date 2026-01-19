export async function seed(knex) {
  const creators = [
    { email: 'raka@pfspace.test', name: 'Raka Pradipta' },
    { email: 'dina@pfspace.test', name: 'Dina Larasati' },
    { email: 'salsa@pfspace.test', name: 'Salsa Nurani' },
    { email: 'dewa@pfspace.test', name: 'Dewa Angkasa' },
    { email: 'iman@pfspace.test', name: 'Iman Fauzan' },
    { email: 'anya@pfspace.test', name: 'Anya Wulandari' },
    { email: 'rio@pfspace.test', name: 'Rio Alvaro' },
    { email: 'mira@pfspace.test', name: 'Mira Santosa' },
    { email: 'surya@pfspace.test', name: 'Surya Mahendra' },
    { email: 'kirana@pfspace.test', name: 'Kirana Devi' }
  ];

  for (const creator of creators) {
    const existing = await knex('users').where('email', creator.email).first();

    if (existing) {
      if (existing.role_id !== 2) {
        await knex('users')
          .where('email', creator.email)
          .update({ role_id: 2 });
      }
      continue;
    }

    const id = crypto.randomUUID();

    await knex('users').insert({
      id,
      email: creator.email,
      name: creator.name,
      emailVerified: true,
      role_id: 2
    });
  }
}

