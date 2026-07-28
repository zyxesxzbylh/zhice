import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env' });
config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString?.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(connectionString, { prepare: false });

async function main() {
  await sql.unsafe(`
    DROP TABLE IF EXISTS task_tags, tags, task_knowledge, task_personnel,
    activity_logs, notifications, retrospectives, flow_instances, flow_templates,
    knowledge_entries, tasks, projects, user_settings, career_profile,
    feishu_sync_log, feishu_config, agent_hooks, users, __drizzle_migrations CASCADE
  `);
  console.log('All tables dropped successfully.');
  await sql.end();
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
