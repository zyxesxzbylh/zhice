import { config } from 'dotenv';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(__dirname, '..', '.env') });
config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function main() {
  const tables = await sql`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    ORDER BY tablename
  `;
  
  console.log('Found tables:', tables.map(t => t.tablename).join(', ') || '(none)');
  
  if (tables.length > 0) {
    const names = tables.map(t => t.tablename).join(', ');
    await sql.unsafe(`DROP TABLE IF EXISTS ${names} CASCADE`);
    console.log(`Dropped ${tables.length} tables.`);
  }
  
  await sql.end();
  console.log('Done.');
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
