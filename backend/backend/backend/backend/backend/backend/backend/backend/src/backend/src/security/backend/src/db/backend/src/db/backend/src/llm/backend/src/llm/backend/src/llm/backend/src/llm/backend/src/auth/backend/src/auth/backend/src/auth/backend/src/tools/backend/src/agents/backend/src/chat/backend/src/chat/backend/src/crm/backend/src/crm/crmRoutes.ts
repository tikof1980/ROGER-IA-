import { Router } from "express";
import { AuthenticatedRequest, requireAuth } from "../auth/authMiddleware";
import { getPool } from "../db/client";
import {
  createProspect,
  listProspects,
  getProspectById,
  updateProspect,
  deleteProspect,
  addProspectNote,
  listProspectNotes,
} from "./prospectRepository";

export const crmRouter = Router();
crmRouter.use(requireAuth);

const VALID_STATUSES = ["nouveau", "contacté", "qualifié", "client", "perdu"];

function dbUnavailable(res: any) {
  return res.status(503).json({ error: "Base de données non connectée. Ajoute DATABASE_URL." });
}

crmRouter.post("/prospects", async (req: AuthenticatedRequest, res) => {
  const { name, sector, contactInfo, source, status, score, potentialNotes } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "name est requis." });
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status doit être l'un de: ${VALID_STATUSES.join(", ")}` });
  }
  if (score !== undefined && (score < 1 || score > 5)) {
    return res.status(400).json({ error: "score doit être entre 1 et 5." });
  }

  const pool = getPool();
  if (!pool) return dbUnavailable(res);

  const prospect = await createProspect(pool, req.user!.userId, {
    name,
    sector,
    contactInfo,
    source,
    status,
    score,
    potentialNotes,
  });
  res.status(201).json(prospect);
});

crmRouter.get("/prospects", async (req: AuthenticatedRequest, res) => {
  const pool = getPool();
  if (!pool) return dbUnavailable(res);

  const { status, minScore } = req.query;
  const prospects = await listProspects(pool, req.user!.userId, {
    status: typeof status === "string" ? status : undefined,
    minScore: typeof minScore === "string" ? Number(minScore) : undefined,
  });
  res.json(prospects);
});

crmRouter.get("/prospects/:id", async (req: AuthenticatedRequest, res) => {
  const pool = getPool();
  if (!pool) return dbUnavailable(res);

  const prospect = await getProspectById(pool, req.user!.userId, req.params.id);
  if (!prospect) return res.status(404).json({ error: "Prospect introuvable." });

  const notes = await listProspectNotes(pool, req.params.id);
  res.json({ ...prospect, notes });
});

crmRouter.patch("/prospects/:id", async (req: AuthenticatedRequest, res) => {
  const { status, score } = req.body ?? {};
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status doit être l'un de: ${VALID_STATUSES.join(", ")}` });
  }
  if (score !== undefined && (score < 1 || score > 5)) {
    return res.status(400).json({ error: "score doit être entre 1 et 5." });
  }

  const pool = getPool();
  if (!pool) return dbUnavailable(res);

  const updated = await updateProspect(pool, req.user!.userId, req.params.id, req.body ?? {});
  if (!updated) return res.status(404).json({ error: "Prospect introuvable." });
  res.json(updated);
});

crmRouter.delete("/prospects/:id", async (req: AuthenticatedRequest, res) => {
  const pool = getPool();
  if (!pool) return dbUnavailable(res);

  const deleted = await deleteProspect(pool, req.user!.userId, req.params.id);
  if (!deleted) return res.status(404).json({ error: "Prospect introuvable." });
  res.status(204).send();
});

crmRouter.post("/prospects/:id/notes", async (req: AuthenticatedRequest, res) => {
  const pool = getPool();
  if (!pool) return dbUnavailable(res);

  const { content } = req.body ?? {};
  if (!content) return res.status(400).json({ error: "content est requis." });

  const prospect = await getProspectById(pool, req.user!.userId, req.params.id);
  if (!prospect) return res.status(404).json({ error: "Prospect introuvable." });

  const note = await addProspectNote(pool, req.params.id, content);
  res.status(201).json(note);
});
