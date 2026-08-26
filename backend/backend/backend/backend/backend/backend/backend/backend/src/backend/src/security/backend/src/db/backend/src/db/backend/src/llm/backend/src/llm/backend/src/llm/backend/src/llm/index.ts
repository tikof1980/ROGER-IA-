import { LLMProvider } from "./types";
import { GeminiProvider } from "./geminiProvider";
import { ClaudeProvider } from "./claudeProvider";

export * from "./types";

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

  if (providerName === "claude") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        "LLM_PROVIDER=claude mais ANTHROPIC_API_KEY est absente. " +
          "Ajoute la clé dans les variables d'environnement, ou repasse LLM_PROVIDER=gemini."
      );
    }
    cachedProvider = new ClaudeProvider(key);
    return cachedProvider;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY est absente. Génère une clé gratuite sur aistudio.google.com " +
        "et ajoute-la dans backend/.env (jamais commitée)."
    );
  }
  cachedProvider = new GeminiProvider(key);
  return cachedProvider;
}

export function _resetProviderCacheForTests() {
  cachedProvider = null;
}
