import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

// Parse the URL ourselves so we can hand explicit fields to postgres.js.
// Bypasses any URL-decoding ambiguity on special chars in the password.
const parsed = new URL(url);
const client = postgres({
  host: parsed.hostname,
  port: parsed.port ? Number(parsed.port) : 5432,
  database: parsed.pathname.slice(1),
  username: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  ssl: 'require',
  max: 1,
  prepare: false,
});

process.stdout.write(
  `connecting as ${decodeURIComponent(parsed.username)} at ${parsed.hostname}\n`,
);

const db = drizzle(client);

await migrate(db, { migrationsFolder: './drizzle' });
process.stdout.write('migrations applied\n');
await client.end();
