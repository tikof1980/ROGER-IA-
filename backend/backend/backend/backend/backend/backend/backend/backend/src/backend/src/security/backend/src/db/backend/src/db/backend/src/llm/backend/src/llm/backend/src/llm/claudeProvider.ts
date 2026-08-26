import { LLMMessage, LLMProvider, LLMResponse, LLMToolDefinition } from "./types";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-6";

export class ClaudeProvider implements LLMProvider {
  readonly name = "claude";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY manquante : impossible d'initialiser ClaudeProvider");
    }
    this.apiKey = apiKey;
  }

  async complete(messages: LLMMessage[], tools: LLMToolDefinition[]): Promise<LLMResponse> {
    const systemMessages = messages.filter((m) => m.role === "system").map((m) => m.content);
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const body = {
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemMessages.join("\n") || undefined,
      messages: conversation,
      tools: tools.length
        ? tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters,
          }))
        : undefined,
    };

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erreur Claude API (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const textBlocks = (data.content ?? []).filter((b: any) => b.type === "text");
    const toolBlocks = (data.content ?? []).filter((b: any) => b.type === "tool_use");

    return {
      text: textBlocks.length ? textBlocks.map((b: any) => b.text).join("\n") : null,
      toolCalls: toolBlocks.map((b: any) => ({ name: b.name, input: b.input })),
      provider: this.name,
    };
  }
}
