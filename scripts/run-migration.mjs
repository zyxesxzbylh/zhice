import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(__dirname, '..', '.env') });
config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const connectionString = process.env.DATABASE_URL;
console.log('DB URL:', connectionString?.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

try {
  console.log('Starting migration...');
  await migrate(db, { migrationsFolder: path.join(__dirname, '..', 'src', 'db', 'migrations') });
  console.log('Migration completed successfully!');
} catch (e) {
  console.error('Migration failed:');
  console.error(e.message);
  if (e.detail) console.error('Detail:', e.detail);
  if (e.hint) console.error('Hint:', e.hint);
  process.exit(1);
} finally {
  await sql.end();
}
