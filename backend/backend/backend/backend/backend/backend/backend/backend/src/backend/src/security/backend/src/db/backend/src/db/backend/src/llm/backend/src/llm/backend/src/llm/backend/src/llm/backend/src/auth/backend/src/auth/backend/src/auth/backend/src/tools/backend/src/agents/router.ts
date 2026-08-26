import { LLMToolDefinition } from "../llm";
import { getToolDefinitions } from "../tools/registry";

export type AgentDomain = "prospecting" | "content" | "general";

const DOMAIN_KEYWORDS: Record<Exclude<AgentDomain, "general">, string[]> = {
  prospecting: ["prospect", "client", "recherche", "entreprise", "restaurant", "salon", "crm", "relance", "qualifi"],
  content: ["post", "publication", "instagram", "facebook", "tiktok", "youtube", "whatsapp", "contenu", "script", "vidéo", "calendrier"],
};

const DOMAIN_TOOLS: Record<AgentDomain, string[]> = {
  prospecting: [
    "search_companies",
    "qualify_prospect",
    "create_prospect",
    "list_prospects",
    "update_prospect_status",
    "add_prospect_note",
    "create_task",
    "list_tasks",
  ],
  content: [
    "generate_post_draft",
    "generate_video_script",
    "adapt_content_for_platform",
    "publish_to_facebook",
    "publish_to_instagram",
    "publish_to_youtube",
    "publish_to_tiktok",
    "send_whatsapp_reply",
    "get_publication_performance",
  ],
  general: [],
};

export function classifyDomain(message: string): AgentDomain {
  const lower = message.toLowerCase();
  const prospectingScore = DOMAIN_KEYWORDS.prospecting.filter((k) => lower.includes(k)).length;
  const contentScore = DOMAIN_KEYWORDS.content.filter((k) => lower.includes(k)).length;

  if (prospectingScore === 0 && contentScore === 0) return "general";
  return prospectingScore >= contentScore ? "prospecting" : "content";
}

const ALWAYS_AVAILABLE = ["get_current_time", "remember_fact", "recall_facts", "generate_qr_code", "list_files"];

export function getToolsForDomain(domain: AgentDomain): LLMToolDefinition[] {
  const all = getToolDefinitions();
  if (domain === "general") return all;

  const allowedNames = new Set([...DOMAIN_TOOLS[domain], ...ALWAYS_AVAILABLE]);
  return all.filter((t) => allowedNames.has(t.name));
}
