import { LLMToolDefinition } from "../llm";

export interface ToolContext {
  userId: string;
}

export type ToolHandler = (
  input: Record<string, unknown>,
  context: ToolContext
) => Promise<Record<string, unknown>>;

interface RegisteredTool {
  definition: LLMToolDefinition;
  handler: ToolHandler;
}

const tools = new Map<string, RegisteredTool>();

export function registerTool(definition: LLMToolDefinition, handler: ToolHandler) {
  tools.set(definition.name, { definition, handler });
}

export function getToolDefinitions(): LLMToolDefinition[] {
  return Array.from(tools.values()).map((t) => t.definition);
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  context: ToolContext
): Promise<Record<string, unknown>> {
  const tool = tools.get(name);
  if (!tool) {
    return { error: `Outil inconnu: ${name}` };
  }
  return tool.handler(input, context);
}

registerTool(
  {
    name: "get_current_time",
    description: "Retourne la date et l'heure actuelles côté serveur.",
    parameters: { type: "object", properties: {} },
  },
  async () => ({ now: new Date().toISOString() })
);
