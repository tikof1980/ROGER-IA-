# Roger IA — Checklist de préparation au déploiement

**Ce document prépare le déploiement. Rien n'a été déployé — c'est une checklist à suivre quand tu es prêt.**

## 1. Comptes à créer (gratuits, aucun ne sera créé par Claude à ta place)
- [ ] Compte Render ou Railway (backend)
- [ ] Compte Supabase (PostgreSQL + Storage)
- [ ] Compte Vercel ou Netlify (frontend)
- [ ] Compte Google AI Studio (clé Gemini gratuite) ou Anthropic (clé Claude)
- [ ] Compte Tavily (recherche, gratuit)

## 2. Variables d'environnement à configurer sur l'hébergeur backend
Copie chaque valeur de `backend/.env.example`, remplie avec tes vraies valeurs,
directement dans le tableau de bord de ton hébergeur (jamais dans un fichier commité) :
```
PORT, LLM_PROVIDER, GEMINI_API_KEY ou ANTHROPIC_API_KEY,
DATABASE_URL, JWT_SECRET, TAVILY_API_KEY, ENCRYPTION_KEY,
SUPABASE_URL, SUPABASE_SERVICE_KEY,
META_APP_ID, META_APP_SECRET, META_REDIRECT_URI,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
AUTOMATIONS_ENABLED
```

## 3. Base de données
Exécuter `backend/src/db/schema.sql` dans l'éditeur SQL Supabase avant le premier démarrage.

## 4. Ordre de déploiement recommandé
1. Backend d'abord (pour obtenir son URL publique).
2. Configurer `META_REDIRECT_URI`/`GOOGLE_REDIRECT_URI` avec cette URL publique + `/social/oauth/.../callback`.
3. Frontend ensuite, avec `VITE_API_BASE_URL` pointant vers l'URL backend publique.
4. Vérifier `/health` répond correctement avant d'activer quoi que ce soit d'autre.
5. `AUTOMATIONS_ENABLED=true` uniquement une fois tout le reste stable (démarre le scheduler cron interne).

## 5. Après déploiement — première vérification
- [ ] `GET /health` répond `{"status":"ok"}`
- [ ] Inscription/connexion fonctionnent
- [ ] Chat répond (LLM connecté)
- [ ] Un compte social peut être connecté via OAuth

## 6. Ce que Claude ne fera jamais sans autorisation explicite
- Créer un compte sur un service tiers en ton nom
- Entrer une clé réelle dans le code ou le chat
- Lancer une commande de déploiement (`railway up`, `git push` vers un remote de prod, etc.)
- Activer `AUTOMATIONS_ENABLED=true` en production
