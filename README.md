# ROGER IA — Phase 0

Assistant commercial et stratégique personnel. Ce dépôt contient la fondation
technique : authentification, chat, moteur IA abstrait (Gemini/Claude
interchangeables). **Aucun outil métier CRM n'est encore implémenté — ça
arrive en Phase 1, après validation de cette base.**

---

## Ce dont tu as besoin pour tester en local

- Node.js 20 ou 22 installé sur ta machine.
- (Optionnel, pour un test de chat qui répond vraiment) une clé Gemini
  **gratuite**, générée sur https://aistudio.google.com/apikey — sans carte
  bancaire.
- (Optionnel) un projet Supabase gratuit si tu veux tester l'inscription/
  connexion réelles plutôt que juste le chat.

Tu peux tester la structure (build, tests, health check) sans rien de tout ça.

---

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Ouvre `.env` et remplis au minimum :
```
JWT_SECRET=une-valeur-aleatoire-longue   # ex: openssl rand -hex 32
```

Pour tester le chat réellement (optionnel) :
```
GEMINI_API_KEY=ta-cle-gemini-gratuite
```

Pour tester la recherche de prospects réellement (optionnel, Phase 1) :
```
TAVILY_API_KEY=ta-cle-tavily-gratuite   # tavily.com, sans carte bancaire, 1000 crédits/mois
```

Pour tester la publication réseaux sociaux réellement (optionnel, Phase 2) :
```
ENCRYPTION_KEY=une-valeur-hex-64-caracteres   # openssl rand -hex 32 — chiffre les tokens en base
```
Puis connecte un compte via `POST /social/accounts` avec un token Facebook/Instagram/YouTube/TikTok
obtenu depuis leurs consoles développeur respectives (procédure détaillée à part, pas dans ce README).

Pour tester l'inscription/connexion réellement (optionnel) :
```
DATABASE_URL=ta-chaine-de-connexion-supabase
```
Si tu ajoutes `DATABASE_URL`, exécute d'abord le schéma dans l'éditeur SQL de
Supabase : `backend/src/db/schema.sql`.

Lancer les tests :
```bash
npm test
```

Lancer le serveur :
```bash
npm run dev
```
Le backend écoute sur http://localhost:3001 par défaut.
Vérifie qu'il tourne : http://localhost:3001/health doit répondre
`{"status":"ok", ...}`.

---

## 2. Frontend

Dans un second terminal :

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Ouvre http://localhost:5173 — tu arrives sur l'écran de connexion.

- Si `DATABASE_URL` n'est pas configuré côté backend, l'inscription/connexion
  renverra une erreur claire ("Base de données non connectée") — normal, pas
  un bug.
- Si `DATABASE_URL` **et** `GEMINI_API_KEY` sont configurés, le parcours
  complet fonctionne : inscription → connexion → chat qui répond vraiment.

---

## 3. Basculer de Gemini vers Claude (plus tard, quand tu es prêt)

Dans `backend/.env` :
```
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=ta-cle-anthropic
```
Aucune ligne de code à changer — c'est exactement ce que l'architecture a été
conçue pour permettre.

---

## 4. Phase 1 — CRM + Prospection (nouveau)

Nouveaux écrans frontend : Dashboard, Prospects, Tâches (navigation en bas de l'app).
Nouveaux endpoints backend : `/crm/prospects`, `/tasks`, `/dashboard`.

Dans le chat, tu peux maintenant demander par exemple :
> "Roger, trouve-moi des restaurants à Abidjan qui pourraient avoir besoin d'un site web."

Roger cherchera (si `TAVILY_API_KEY` est configuré), qualifiera les résultats, te les présentera,
et n'enregistrera au CRM que ce que tu valides explicitement.

Sans `TAVILY_API_KEY`, Roger explique simplement qu'il ne peut pas chercher pour l'instant —
aucun crash, aucune facturation.

---

## 5. Phase 2 — Réseaux sociaux + Contenu (nouveau)

Nouveaux écrans : Contenus (bibliothèque), Calendrier.
Nouveaux endpoints : `/content/*`, `/social/accounts`.

Dans le chat, tu peux demander :
> "Roger, prépare-moi un post Instagram sur nos services de développement web."

Roger génère un brouillon, jamais publié automatiquement. Une fois validé, un compte
social connecté permet de le publier réellement (Facebook, Instagram, YouTube sans
condition particulière ; TikTok reste privé tant que le compte n'est pas marqué audité ;
WhatsApp devient payant par message à partir du 1er octobre 2026, bloqué par défaut après
cette date sans confirmation explicite).

**Garde-fous actifs dans le code, pas seulement documentés** :
- TikTok : `tiktok_client_audited=false` par défaut → toute publication reste privée.
- WhatsApp : `whatsapp_billing_confirmed_by_user=false` par défaut → tout envoi après le
  1er octobre 2026 est bloqué tant que ce flag n'est pas activé explicitement.

---

## 6. Phase 3 — Intelligence, mémoire, automatisations, fichiers, QR (nouveau)

- **Router multi-agent léger** : classification par mots-clés (prospection/contenu/général),
  filtre les outils présentés au LLM par domaine.
- **Mémoire long terme** : `remember_fact`/`recall_facts`, distincte de l'historique de conversation.
- **Automatisations** : règles stockées (`automation_rules`) — l'exécution réelle programmée
  nécessite `AUTOMATIONS_ENABLED=true` **et** un déploiement continu (voir `docs/deploiement.md`).
- **Fichiers** : upload réel via Supabase Storage (`POST /files/upload`), extraction de texte
  txt/csv/PDF/DOCX.
- **QR Code** : génération locale gratuite, endpoint `POST /qrcode`.
- **Command Center** : `GET /command-center`, vue agrégée (tâches, prospects, contenu, automatisations, fichiers).

## 7. Phase 4 — Finalisation (nouveau)

- **OAuth réel** Meta (Facebook/Instagram) et Google (YouTube) : `GET /social/oauth/meta/authorize-url`
  puis `POST /social/oauth/meta/callback` (même principe pour Google). Nécessite `META_APP_ID`/`META_APP_SECRET`
  ou `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` configurés — absents par défaut, erreur explicite sinon.
- **Sécurité** : helmet, rate limiting (300 req/15min général, 20 req/15min sur `/auth`), compression,
  logs JSON structurés avec identifiant de requête (`X-Request-Id`).
- **UI/UX** : identité visuelle propre (ambre chaud sur fond sombre, police Space Grotesk/Inter),
  responsive amélioré, PWA à jour.
- **Préparation au déploiement** : voir `docs/deploiement.md` — checklist complète, rien n'est déployé.

---

## Structure du projet

```
roger-ia/
├── backend/     API Node.js/Express/TypeScript (auth, chat, moteur IA)
├── frontend/    PWA React (Login, Chat)
└── docs/        Documents d'architecture
```

Détail complet dans `docs/architecture.md`.
