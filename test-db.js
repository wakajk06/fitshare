import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error('❌ Please set DATABASE_URL in .env.local');
  process.exit(1);
}

async function testConnection() {
  console.log('Connecting to Neon PostgreSQL database...');
  const sql = neon(dbUrl);
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
  console.log('✔ Active tables in Neon DB:', tables.map(t => t.table_name));
}

testConnection().catch(err => {
  console.error('❌ Connection failed:', err);
  process.exit(1);
});
