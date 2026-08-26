import { Router } from "express";
import { AuthenticatedRequest, requireAuth } from "../auth/authMiddleware";
import { getPool } from "../db/client";
import { runChatTurn } from "./chatService";
import { LLMMessage } from "../llm";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.post("/conversations", async (req: AuthenticatedRequest, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Base de données non connectée." });

  const result = await pool.query(
    "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at",
    [req.user!.userId, req.body?.title ?? "Nouvelle conversation"]
  );
  res.status(201).json(result.rows[0]);
});

chatRouter.get("/conversations/:id/messages", async (req: AuthenticatedRequest, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Base de données non connectée." });

  const result = await pool.query(
    "SELECT role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
    [req.params.id]
  );
  res.json(result.rows);
});

chatRouter.post("/conversations/:id/messages", async (req: AuthenticatedRequest, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Base de données non connectée." });

  const { content } = req.body ?? {};
  if (!content) return res.status(400).json({ error: "content est requis." });

  const conversationId = req.params.id;

  const historyResult = await pool.query(
    "SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
    [conversationId]
  );
  const history: LLMMessage[] = historyResult.rows
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({ role: r.role, content: r.content }));
  history.push({ role: "user", content });

  await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', $2)",
    [conversationId, content]
  );

  let replyText: string;
  try {
    replyText = await runChatTurn(history, req.user!.userId);
  } catch (err: any) {
    return res.status(502).json({
      error: "Le moteur IA a renvoyé une erreur.",
      details: err.message,
    });
  }

  await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)",
    [conversationId, replyText]
  );

  res.json({ reply: replyText });
});
