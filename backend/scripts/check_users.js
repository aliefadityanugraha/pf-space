import { initDatabase } from '../src/database/index.js';
import { User } from '../src/models/User.js';

async function check() {
  await initDatabase();
  const users = await User.query().orderBy('createdAt', 'desc').limit(5).withGraphFetched('role');
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
