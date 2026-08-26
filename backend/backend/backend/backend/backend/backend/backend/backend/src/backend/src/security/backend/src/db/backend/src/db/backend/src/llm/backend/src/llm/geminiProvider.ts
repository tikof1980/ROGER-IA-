import { LLMMessage, LLMProvider, LLMResponse, LLMToolDefinition } from "./types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY manquante : impossible d'initialiser GeminiProvider");
    }
    this.apiKey = apiKey;
  }

  async complete(messages: LLMMessage[], tools: LLMToolDefinition[]): Promise<LLMResponse> {
    const systemMessages = messages.filter((m) => m.role === "system").map((m) => m.content);
    const conversation = messages.filter((m) => m.role !== "system");

    const body = {
      systemInstruction: systemMessages.length
        ? { parts: [{ text: systemMessages.join("\n") }] }
        : undefined,
      contents: conversation.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      tools: tools.length
        ? [
            {
              functionDeclarations: tools.map((t) => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              })),
            },
          ]
        : undefined,
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erreur Gemini API (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text);
    const functionCalls = parts
      .filter((p: any) => p.functionCall)
      .map((p: any) => ({
        name: p.functionCall.name,
        input: p.functionCall.args ?? {},
      }));

    return {
      text: textParts.length ? textParts.join("\n") : null,
      toolCalls: functionCalls,
      provider: this.name,
    };
  }
}
