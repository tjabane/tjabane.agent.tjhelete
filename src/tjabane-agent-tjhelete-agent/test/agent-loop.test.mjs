import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversationOrchestrator,
  DefaultAgent,
  DefaultAgentFactory,
  SessionNotFoundError,
} from "../dist/index.js";

const config = { model: "test-model", maxToolTurns: 2 };
const executionContext = {
  userId: "user-1",
  sessionId: "session-1",
  timezone: "Africa/Johannesburg",
  now: new Date("2026-07-26T10:00:00.000Z"),
};

test("agent appends the user message and returns a final model reply", async () => {
  const requests = [];
  const modelClient = {
    async createResponse(request) {
      requests.push(request);
      return { text: "You spent R120 today.", toolCalls: [] };
    },
  };
  const existingHistory = [{ role: "assistant", content: "How can I help?" }];
  const agent = new DefaultAgent(
    existingHistory,
    modelClient,
    createToolRegistry(),
    config,
    executionContext,
  );
  const reply = await agent.sendMessage("What did I spend?");
  assert.equal(reply, "You spent R120 today.");
  assert.deepEqual(requests, [
    {
      model: "test-model",
      history: [
        { role: "assistant", content: "How can I help?" },
        { role: "user", content: "What did I spend?" },
      ],
      tools: [],
    },
  ]);
  assert.deepEqual(agent.getHistory(), [
    { role: "assistant", content: "How can I help?" },
    { role: "user", content: "What did I spend?" },
    { role: "assistant", content: "You spent R120 today." },
  ]);
  assert.deepEqual(existingHistory, [{ role: "assistant", content: "How can I help?" }]);
});

test("agent leaves configuration validation to its dependencies", async () => {
  const configurationError = new Error("Invalid model configuration.");
  const modelClient = {
    async createResponse(request) {
      assert.equal(request.model, "");
      throw configurationError;
    },
  };
  const agent = new DefaultAgent(
    [],
    modelClient,
    createToolRegistry(),
    { model: "", maxToolTurns: config.maxToolTurns },
    executionContext,
  );

  await assert.rejects(
    () => agent.sendMessage("Hello"),
    (error) => error === configurationError,
  );
});

test("agent serializes tool results into canonical JSON history before continuing", async () => {
  const requests = [];
  const modelClient = {
    async createResponse(request) {
      requests.push(request);
      if (requests.length === 1) {
        return {
          text: "",
          toolCalls: [
            {
              id: "call-1",
              name: "get_spending_summary",
              arguments: { period: "today" },
            },
          ],
        };
      }
      return { text: "You spent R120 today.", toolCalls: [] };
    },
  };
  const executions = [];
  const toolRegistry = createToolRegistry(
    [
      {
        name: "get_spending_summary",
        description: "Summarise spending.",
        inputSchema: { type: "object" },
      },
    ],
    async (name, context, arguments_) => {
      executions.push({ name, context, arguments_ });
      return { ok: true, data: { total: 120, currency: "ZAR" } };
    },
  );
  const agent = new DefaultAgent([], modelClient, toolRegistry, config, executionContext);
  const reply = await agent.sendMessage("What did I spend?");
  assert.equal(reply, "You spent R120 today.");
  assert.deepEqual(executions, [
    {
      name: "get_spending_summary",
      context: executionContext,
      arguments_: { period: "today" },
    },
  ]);
  assert.deepEqual(requests[1].history, [
    { role: "user", content: "What did I spend?" },
    {
      role: "assistant",
      content: "",
      toolCalls: [
        {
          id: "call-1",
          name: "get_spending_summary",
          arguments: { period: "today" },
        },
      ],
    },
    {
      role: "tool",
      content: '{"ok":true,"data":{"total":120,"currency":"ZAR"}}',
      name: "get_spending_summary",
      toolCallId: "call-1",
    },
  ]);
});

test("agent gives the model a failed tool result when tool execution throws", async () => {
  const requests = [];
  const modelClient = {
    async createResponse(request) {
      requests.push(request);
      if (requests.length === 1) {
        return {
          text: "",
          toolCalls: [{ id: "call-1", name: "get_balances", arguments: {} }],
        };
      }
      return { text: "I couldn't retrieve your balances right now.", toolCalls: [] };
    },
  };
  const toolRegistry = createToolRegistry(
    [{ name: "get_balances", description: "Get balances.", inputSchema: {} }],
    async () => {
      throw new Error("Provider credentials were rejected.");
    },
  );
  const agent = new DefaultAgent([], modelClient, toolRegistry, config, executionContext);

  const reply = await agent.sendMessage("What is my balance?");

  assert.equal(reply, "I couldn't retrieve your balances right now.");
  assert.deepEqual(JSON.parse(requests[1].history.at(-1).content), {
    ok: false,
    error: {
      code: "tool_execution_failed",
      message: "The tool could not be executed because of an unexpected internal failure.",
      retryable: true,
    },
  });
  assert.doesNotMatch(requests[1].history.at(-1).content, /credentials/i);
});

test("agent requests a final reply without tools after reaching the tool-turn limit", async () => {
  let requestCount = 0;
  const modelClient = {
    async createResponse(request) {
      requestCount += 1;
      if (request.tools.length === 0) {
        return {
          text: "I couldn't complete the remaining checks within this request.",
          toolCalls: [],
        };
      }
      return {
        text: "",
        toolCalls: [{ id: `call-${requestCount}`, name: "repeat", arguments: {} }],
      };
    },
  };
  let executionCount = 0;
  const agent = new DefaultAgent(
    [],
    modelClient,
    createToolRegistry([{ name: "repeat", description: "Repeat.", inputSchema: {} }], async () => {
      executionCount += 1;
      return { ok: true, data: { repeated: true } };
    }),
    { ...config, maxToolTurns: 1 },
    executionContext,
  );

  const reply = await agent.sendMessage("Keep going");

  assert.equal(reply, "I couldn't complete the remaining checks within this request.");
  assert.equal(requestCount, 3);
  assert.equal(executionCount, 1);
  assert.deepEqual(JSON.parse(agent.getHistory().at(-2).content), {
    ok: false,
    error: {
      code: "tool_turn_limit_reached",
      message:
        "No more tools can be executed for this response because the tool-use limit was reached.",
      retryable: false,
    },
  });
});

test("agent uses a deterministic reply when tool-limit finalisation fails", async () => {
  let requestCount = 0;
  const modelClient = {
    async createResponse() {
      requestCount += 1;
      if (requestCount === 1) {
        return { text: "", toolCalls: [{ id: "call-1", name: "repeat", arguments: {} }] };
      }
      throw new Error("Model provider unavailable.");
    },
  };
  const agent = new DefaultAgent(
    [],
    modelClient,
    createToolRegistry([{ name: "repeat", description: "Repeat.", inputSchema: {} }]),
    { ...config, maxToolTurns: 0 },
    executionContext,
  );

  const reply = await agent.sendMessage("Keep going");

  assert.match(reply, /tool-use limit/i);
  assert.equal(agent.getHistory().at(-1).content, reply);
});

test("orchestrator loads a session, runs the agent, and saves its history", async () => {
  const savedSessions = [];
  const sessionRepository = {
    async findById(id) {
      assert.equal(id, "session-1");
      return {
        id,
        userId: "user-1",
        history: [{ role: "assistant", content: "Welcome back." }],
      };
    },
    async save(session) {
      savedSessions.push(session);
    },
  };
  const modelClient = {
    async createResponse() {
      return { text: "Here is your answer.", toolCalls: [] };
    },
  };
  const agentFactory = new DefaultAgentFactory(modelClient, createToolRegistry(), config);
  const orchestrator = new ConversationOrchestrator(sessionRepository, agentFactory, {
    timezone: "Africa/Johannesburg",
    now: () => executionContext.now,
  });
  const reply = await orchestrator.sendMessage("session-1", "Hello");
  assert.equal(reply, "Here is your answer.");
  assert.deepEqual(savedSessions, [
    {
      id: "session-1",
      userId: "user-1",
      history: [
        { role: "assistant", content: "Welcome back." },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Here is your answer." },
      ],
    },
  ]);
});

test("orchestrator fails clearly when the session does not exist", async () => {
  const sessionRepository = {
    async findById() {
      return null;
    },
    async save() {
      assert.fail("A missing session must not be saved.");
    },
  };
  const agentFactory = {
    create() {
      assert.fail("An agent must not be created for a missing session.");
    },
  };
  const orchestrator = new ConversationOrchestrator(sessionRepository, agentFactory);
  await assert.rejects(
    () => orchestrator.sendMessage("missing", "Hello"),
    (error) =>
      error instanceof SessionNotFoundError && error.message === 'Session "missing" was not found.',
  );
});

function createToolRegistry(
  definitions = [],
  execute = async () => {
    assert.fail("No tool execution was expected.");
  },
) {
  return { getDefinitions: () => definitions, execute };
}
