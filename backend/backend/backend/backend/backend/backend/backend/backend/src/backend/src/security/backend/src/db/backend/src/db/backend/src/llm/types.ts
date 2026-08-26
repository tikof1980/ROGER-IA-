export type LLMRole = "user" | "assistant" | "system";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface LLMResponse {
  text: string | null;
  toolCalls: LLMToolCall[];
  provider: string;
}

export interface LLMProvider {
  readonly name: string;
  complete(
    messages: LLMMessage[],
    tools: LLMToolDefinition[]
  ): Promise<LLMResponse>;
}
