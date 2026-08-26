import { Router } from "express";
import { getPool } from "../db/client";
import { hashPassword, verifyPassword, signToken } from "./authUtils";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({
      error: "Base de données non connectée. Ajoute DATABASE_URL (Supabase) dans backend/.env.",
    });
  }

  const { email, password, businessName } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "email et password sont requis." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, business_name)
     VALUES ($1, $2, $3) RETURNING id, email`,
    [email, passwordHash, businessName ?? null]
  );

  const user = result.rows[0];
  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

authRouter.post("/login", async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({
      error: "Base de données non connectée. Ajoute DATABASE_URL (Supabase) dans backend/.env.",
    });
  }

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "email et password sont requis." });
  }

  const result = await pool.query(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email } });
});
