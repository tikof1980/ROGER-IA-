# Roger IA — Référence d'architecture (Phase 0)

Ce fichier résume les décisions déjà validées pour éviter toute dérive au fil
des phases. Détail complet dans les documents livrés séparément :
- Audit initial + architecture générale
- Architecture MVP détaillée
- Dossier de validation Phase 0
- Stratégie 0 coût

## Décisions figées
- Projet indépendant (pas une évolution de WaMarket IA / GOD.ROGWEBSERVICE / JEMIMA), pensé pour s'y connecter plus tard via API.
- MVP = CRM + Prospection.
- Roadmap : MVP → V2 Social/Content → V3 Multi-Agent/Automation → V4 Autonomie avancée/Multi-LLM/Lab/QR.
- Autonomie niveau 1 au MVP : Roger propose, l'utilisateur valide avant toute écriture importante.
- Stack dev/tests 0 coût : Render (backend), Supabase (DB+Auth+Storage), Vercel (frontend), Gemini (LLM gratuit), GitHub/GitHub Actions.
- Sous-domaine cible : roger.rogwebservice.com (pas encore configuré, pas bloquant).
- Aucun secret dans le code, le chat, ou Git. Variables d'environnement uniquement.
- Aucun déploiement ni service payant sans validation explicite préalable.

## Principe d'abstraction LLM
Tout le code métier appelle `getLLMProvider().complete(...)` (backend/src/llm/index.ts).
Aucun module en dehors de `backend/src/llm/` ne doit importer un SDK Gemini ou
Anthropic directement. Changer `LLM_PROVIDER` dans `.env` suffit à basculer.

## Ce qui n'est PAS encore construit (volontairement)
Gestion de fichiers, multi-agent, multi-LLM dynamique, QR codes, automatisations,
social media/content (V2+). Prévu uniquement après validation explicite de chaque étape.

## État Phase 1 (validé, en attente de confirmation finale utilisateur)
CRM (prospects + notes), tâches, dashboard, recherche via Tavily (interface
`SearchProvider` abstraite, même pattern que `llm/`), outils métier
(search_companies, qualify_prospect, create_prospect, list_prospects,
update_prospect_status, add_prospect_note, create_task, list_tasks) enregistrés
dans le même `tools/registry.ts` que la Phase 0.

Modifications Phase 0 nécessaires et validées par l'utilisateur :
- `tools/registry.ts` : ajout de `ToolContext { userId }` pour l'isolation des données.
- `chat/chatService.ts` : `runChatTurn(history, userId)`, `MAX_TOOL_ROUNDS` 3→5.
Aucun autre fichier Phase 0 modifié en logique (seuls `index.ts` a reçu des
imports/montages additifs).
