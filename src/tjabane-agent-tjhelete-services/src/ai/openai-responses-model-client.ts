import type {
  ConversationMessage,
  ModelClient,
  ModelRequest,
  ModelToolCall,
  ModelTurn,
  ToolDefinition,
} from "@tjabane-agent-tjhelete/agent";
import type { HttpClient } from "../http/http-client.interface.js";
import {
  ModelProviderError,
  ModelProviderResponseValidationError,
} from "./model-provider-error.js";

type OpenAiInputItem = Readonly<Record<string, unknown>>;

export interface OpenAiResponsesModelClientOptions {
  readonly endpoint?: URL;
  readonly timeoutMs?: number;
}

export class OpenAiResponsesModelClient implements ModelClient {
  private readonly endpoint: URL;
  private readonly timeoutMs: number;

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly apiKey: string,
    options: OpenAiResponsesModelClientOptions = {},
  ) {
    if (apiKey.trim().length === 0) {
      throw new Error("OpenAI API key must be non-empty.");
    }

    this.endpoint = options.endpoint ?? new URL("https://api.openai.com/v1/responses");
    this.timeoutMs = options.timeoutMs ?? 30_000;

    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new RangeError("OpenAI request timeout must be a positive finite number.");
    }
  }

  public async createResponse(input: ModelRequest): Promise<ModelTurn> {
    try {
      const response = await this.httpClient.request({
        method: "POST",
        url: this.endpoint,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: input.model,
          input: input.history.flatMap(mapConversationMessage),
          tools: input.tools.map(mapToolDefinition),
          store: false,
        }),
        timeoutMs: this.timeoutMs,
      });

      return decodeModelTurn(response.body);
    } catch (error) {
      if (error instanceof ModelProviderError) {
        throw error;
      }

      throw new ModelProviderError({ cause: error });
    }
  }
}

function mapConversationMessage(message: ConversationMessage): readonly OpenAiInputItem[] {
  if (message.role === "tool") {
    if (message.toolCallId === undefined) {
      throw new ModelProviderError();
    }

    return [
      {
        type: "function_call_output",
        call_id: message.toolCallId,
        output: message.content,
      },
    ];
  }

  const items: OpenAiInputItem[] = [];

  if (message.content.length > 0 || message.toolCalls === undefined) {
    items.push({ role: message.role, content: message.content });
  }

  for (const toolCall of message.toolCalls ?? []) {
    items.push({
      type: "function_call",
      call_id: toolCall.id,
      name: toolCall.name,
      arguments: JSON.stringify(toolCall.arguments),
    });
  }

  return items;
}

function mapToolDefinition(definition: ToolDefinition): Readonly<Record<string, unknown>> {
  return {
    type: "function",
    name: definition.name,
    description: definition.description,
    parameters: definition.inputSchema,
    strict: false,
  };
}

function decodeModelTurn(body: unknown): ModelTurn {
  const response = readObject(body);

  if (response.status !== "completed" || !Array.isArray(response.output)) {
    throw new ModelProviderResponseValidationError();
  }

  const textParts: string[] = [];
  const toolCalls: ModelToolCall[] = [];

  for (const rawItem of response.output) {
    const item = readObject(rawItem);

    if (item.type === "message") {
      if (!Array.isArray(item.content)) {
        throw new ModelProviderResponseValidationError();
      }

      for (const rawContent of item.content) {
        const content = readObject(rawContent);

        if (content.type === "output_text") {
          textParts.push(readString(content.text));
        }
      }
    } else if (item.type === "function_call") {
      const argumentsText = readString(item.arguments);
      let arguments_: unknown;

      try {
        arguments_ = JSON.parse(argumentsText) as unknown;
      } catch {
        throw new ModelProviderResponseValidationError();
      }

      toolCalls.push({
        id: readString(item.call_id),
        name: readString(item.name),
        arguments: arguments_,
      });
    }
  }

  const text = textParts.join("");

  if (text.length === 0 && toolCalls.length === 0) {
    throw new ModelProviderResponseValidationError();
  }

  return { text, toolCalls };
}

function readObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ModelProviderResponseValidationError();
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ModelProviderResponseValidationError();
  }

  return value;
}
