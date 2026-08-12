import { neon } from '@neondatabase/serverless';

export function getDb() {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL;

  if (!dbUrl) {
    return null;
  }
  return neon(dbUrl);
}
