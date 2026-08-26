import { getLLMProvider, LLMMessage } from "../llm";
import { executeTool } from "../tools/registry";
import { classifyDomain, getToolsForDomain } from "../agents/router";

const SYSTEM_PROMPT = `Tu es Roger IA, l'assistant commercial et stratégique personnel de l'utilisateur.
Tu l'aides à trouver des clients, gérer ses prospects, organiser son activité,
et maintenant créer et publier du contenu sur les réseaux sociaux.
Réponds en français, de façon directe et concise.
Pour la prospection : recherche puis qualifie les entreprises avant de les enregistrer.
N'enregistre un prospect dans le CRM (create_prospect) qu'après validation explicite
de l'utilisateur sur la liste proposée — ne l'automatise jamais silencieusement.
Distingue toujours ce qui est vérifié par une recherche de ce qui est déduit.
Pour le contenu : génère toujours un brouillon (generate_post_draft/generate_video_script)
et fais-le valider avant d'appeler un outil publish_to_*. Ne publie jamais un contenu
non validé explicitement par l'utilisateur.
TikTok reste privé tant que l'utilisateur n'a pas confirmé que son compte est audité —
ne promets jamais une publication TikTok publique sans cette confirmation.
WhatsApp devient payant par message à partir du 1er octobre 2026 — signale-le à
l'utilisateur si on approche de cette date et qu'aucune confirmation de facturation n'a été donnée.`;

const MAX_TOOL_ROUNDS = 5;

export async function runChatTurn(history: LLMMessage[], userId: string): Promise<string> {
  const provider = getLLMProvider();
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const domain = classifyDomain(lastUserMessage);
  const tools = getToolsForDomain(domain);

  const messages: LLMMessage[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await provider.complete(messages, tools);

    if (response.text && response.toolCalls.length === 0) {
      return response.text;
    }

    if (response.toolCalls.length === 0) {
      return "Je n'ai pas pu produire de réponse. Réessaie ta demande autrement.";
    }

    for (const call of response.toolCalls) {
      const result = await executeTool(call.name, call.input, { userId });
      messages.push({
        role: "assistant",
        content: `[Appel outil ${call.name} avec ${JSON.stringify(call.input)}]`,
      });
      messages.push({
        role: "user",
        content: `[Résultat de ${call.name}]: ${JSON.stringify(result)}`,
      });
    }
  }

  return "Roger a atteint la limite d'étapes pour cette demande — reformule ou simplifie ta question.";
}
