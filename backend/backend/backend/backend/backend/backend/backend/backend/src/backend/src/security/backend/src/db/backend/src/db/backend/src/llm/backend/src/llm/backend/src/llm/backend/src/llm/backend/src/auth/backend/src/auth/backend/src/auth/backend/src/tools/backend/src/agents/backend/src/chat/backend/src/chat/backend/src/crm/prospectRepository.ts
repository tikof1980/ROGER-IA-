import { Pool } from "pg";

export interface ProspectInput {
  name: string;
  sector?: string;
  contactInfo?: string;
  source?: string;
  status?: "nouveau" | "contacté" | "qualifié" | "client" | "perdu";
  score?: number;
  potentialNotes?: string;
}

export interface ProspectFilters {
  status?: string;
  minScore?: number;
}

export async function createProspect(pool: Pool, userId: string, input: ProspectInput) {
  const result = await pool.query(
    `INSERT INTO prospects (user_id, name, sector, contact_info, source, status, score, potential_notes)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'nouveau'), $7, $8)
     RETURNING *`,
    [
      userId,
      input.name,
      input.sector ?? null,
      input.contactInfo ?? null,
      input.source ?? null,
      input.status ?? null,
      input.score ?? null,
      input.potentialNotes ?? null,
    ]
  );
  return result.rows[0];
}

export async function listProspects(pool: Pool, userId: string, filters: ProspectFilters = {}) {
  const conditions = ["user_id = $1"];
  const params: unknown[] = [userId];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.minScore !== undefined) {
    params.push(filters.minScore);
    conditions.push(`score >= $${params.length}`);
  }

  const result = await pool.query(
    `SELECT * FROM prospects WHERE ${conditions.join(" AND ")} ORDER BY updated_at DESC`,
    params
  );
  return result.rows;
}

export async function getProspectById(pool: Pool, userId: string, id: string) {
  const result = await pool.query("SELECT * FROM prospects WHERE id = $1 AND user_id = $2", [
    id,
    userId,
  ]);
  return result.rows[0] ?? null;
}

export async function updateProspect(
  pool: Pool,
  userId: string,
  id: string,
  input: Partial<ProspectInput>
) {
  const fields: string[] = [];
  const params: unknown[] = [];

  const map: Record<string, unknown> = {
    name: input.name,
    sector: input.sector,
    contact_info: input.contactInfo,
    source: input.source,
    status: input.status,
    score: input.score,
    potential_notes: input.potentialNotes,
  };

  for (const [column, value] of Object.entries(map)) {
    if (value !== undefined) {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  }
  if (fields.length === 0) return getProspectById(pool, userId, id);

  fields.push("updated_at = now()");
  params.push(id, userId);

  const result = await pool.query(
    `UPDATE prospects SET ${fields.join(", ")}
     WHERE id = $${params.length - 1} AND user_id = $${params.length}
     RETURNING *`,
    params
  );
  return result.rows[0] ?? null;
}

export async function deleteProspect(pool: Pool, userId: string, id: string) {
  const result = await pool.query(
    "DELETE FROM prospects WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );
  return result.rowCount! > 0;
}

export async function addProspectNote(pool: Pool, prospectId: string, content: string) {
  const result = await pool.query(
    "INSERT INTO prospect_notes (prospect_id, content) VALUES ($1, $2) RETURNING *",
    [prospectId, content]
  );
  return result.rows[0];
}

export async function listProspectNotes(pool: Pool, prospectId: string) {
  const result = await pool.query(
    "SELECT * FROM prospect_notes WHERE prospect_id = $1 ORDER BY created_at DESC",
    [prospectId]
  );
  return result.rows;
}
