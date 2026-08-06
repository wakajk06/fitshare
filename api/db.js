import { neon } from '@neondatabase/serverless';

export function getDb() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return null;
  }
  return neon(dbUrl);
}
