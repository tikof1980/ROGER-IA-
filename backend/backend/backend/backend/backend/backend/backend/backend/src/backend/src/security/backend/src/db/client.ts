import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}
