import assert from "node:assert/strict";
import { test } from "node:test";
import { ModelProviderResponseValidationError, OpenAiResponsesModelClient } from "../dist/index.js";

test("OpenAI adapter maps provider-neutral history, tools, and function calls", async () => {
  const requests = [];
  const httpClient = {
    async request(request) {
      requests.push(request);
      return {
        status: 200,
        headers: {},
        body: {
          status: "completed",
          output: [
            {
              type: "function_call",
              call_id: "call-1",
              name: "list_transactions",
              arguments: '{"fromDate":"2026-08-01","toDate":"2026-08-01"}',
            },
          ],
        },
      };
    },
  };
  const client = new OpenAiResponsesModelClient(httpClient, "secret-key", {
    endpoint: new globalThis.URL("https://model.test/v1/responses"),
    timeoutMs: 1_234,
  });

  const turn = await client.createResponse({
    model: "test-model",
    history: [
      { role: "system", content: "Be concise." },
      { role: "user", content: "List today's transactions" },
      {
        role: "assistant",
        content: "",
        toolCalls: [{ id: "previous-call", name: "list_accounts", arguments: {} }],
      },
      {
        role: "tool",
        content: '{"ok":true,"data":{"accounts":[]}}',
        toolCallId: "previous-call",
        name: "list_accounts",
      },
    ],
    tools: [
      {
        name: "list_transactions",
        description: "List transactions.",
        inputSchema: { type: "object", additionalProperties: false },
      },
    ],
  });

  assert.deepEqual(turn, {
    text: "",
    toolCalls: [
      {
        id: "call-1",
        name: "list_transactions",
        arguments: { fromDate: "2026-08-01", toDate: "2026-08-01" },
      },
    ],
  });
  assert.equal(requests[0].timeoutMs, 1_234);
  assert.equal(requests[0].headers.Authorization, "Bearer secret-key");
  assert.deepEqual(JSON.parse(requests[0].body), {
    model: "test-model",
    input: [
      { role: "system", content: "Be concise." },
      { role: "user", content: "List today's transactions" },
      {
        type: "function_call",
        call_id: "previous-call",
        name: "list_accounts",
        arguments: "{}",
      },
      {
        type: "function_call_output",
        call_id: "previous-call",
        output: '{"ok":true,"data":{"accounts":[]}}',
      },
    ],
    tools: [
      {
        type: "function",
        name: "list_transactions",
        description: "List transactions.",
        parameters: { type: "object", additionalProperties: false },
        strict: false,
      },
    ],
    store: false,
  });
});

test("OpenAI adapter validates provider output without exposing it", async () => {
  const client = new OpenAiResponsesModelClient(
    {
      async request() {
        return {
          status: 200,
          headers: {},
          body: { status: "completed", output: [{ type: "unexpected", secret: "value" }] },
        };
      },
    },
    "secret-key",
  );

  await assert.rejects(
    () => client.createResponse({ model: "test", history: [], tools: [] }),
    (error) =>
      error instanceof ModelProviderResponseValidationError && !error.message.includes("secret"),
  );
});
