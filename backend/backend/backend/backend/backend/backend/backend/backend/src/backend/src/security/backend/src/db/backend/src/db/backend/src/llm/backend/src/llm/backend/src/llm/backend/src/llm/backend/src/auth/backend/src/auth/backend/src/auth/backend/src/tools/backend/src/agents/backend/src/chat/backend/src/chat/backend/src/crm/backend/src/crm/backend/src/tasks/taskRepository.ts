import { Pool } from "pg";

export interface TaskInput {
  title: string;
  prospectId?: string | null;
  dueDate?: string | null;
  priority?: "basse" | "normale" | "haute";
  status?: "à faire" | "en cours" | "terminée";
}

export interface TaskFilters {
  status?: string;
  dueBefore?: string;
}

export async function createTask(pool: Pool, userId: string, input: TaskInput) {
  const result = await pool.query(
    `INSERT INTO tasks (user_id, prospect_id, title, due_date, priority, status)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'normale'), COALESCE($6, 'à faire'))
     RETURNING *`,
    [
      userId,
      input.prospectId ?? null,
      input.title,
      input.dueDate ?? null,
      input.priority ?? null,
      input.status ?? null,
    ]
  );
  return result.rows[0];
}

export async function listTasks(pool: Pool, userId: string, filters: TaskFilters = {}) {
  const conditions = ["user_id = $1"];
  const params: unknown[] = [userId];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.dueBefore) {
    params.push(filters.dueBefore);
    conditions.push(`due_date <= $${params.length}`);
  }

  const result = await pool.query(
    `SELECT * FROM tasks WHERE ${conditions.join(" AND ")} ORDER BY due_date ASC NULLS LAST`,
    params
  );
  return result.rows;
}

export async function updateTask(pool: Pool, userId: string, id: string, input: Partial<TaskInput>) {
  const fields: string[] = [];
  const params: unknown[] = [];

  const map: Record<string, unknown> = {
    title: input.title,
    prospect_id: input.prospectId,
    due_date: input.dueDate,
    priority: input.priority,
    status: input.status,
  };

  for (const [column, value] of Object.entries(map)) {
    if (value !== undefined) {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  }
  if (fields.length === 0) {
    const existing = await pool.query("SELECT * FROM tasks WHERE id = $1 AND user_id = $2", [
      id,
      userId,
    ]);
    return existing.rows[0] ?? null;
  }

  params.push(id, userId);
  const result = await pool.query(
    `UPDATE tasks SET ${fields.join(", ")}
     WHERE id = $${params.length - 1} AND user_id = $${params.length}
     RETURNING *`,
    params
  );
  return result.rows[0] ?? null;
}
