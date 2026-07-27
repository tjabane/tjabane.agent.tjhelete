import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversationOrchestrator,
  DefaultAgent,
  DefaultAgentFactory,
  SessionNotFoundError,
  ToolTurnLimitExceededError,
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

test("agent executes requested tools and continues until the model replies", async () => {
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
      return { data: { total: 120, currency: "ZAR" } };
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
      content: '{"total":120,"currency":"ZAR"}',
      name: "get_spending_summary",
      toolCallId: "call-1",
    },
  ]);
});

test("agent stops when the model exceeds the configured tool-turn limit", async () => {
  let requestCount = 0;
  const modelClient = {
    async createResponse() {
      requestCount += 1;
      return {
        text: "",
        toolCalls: [{ id: `call-${requestCount}`, name: "repeat", arguments: {} }],
      };
    },
  };
  const agent = new DefaultAgent(
    [],
    modelClient,
    createToolRegistry([{ name: "repeat", description: "Repeat.", inputSchema: {} }], async () => ({
      data: { ok: true },
    })),
    { ...config, maxToolTurns: 1 },
    executionContext,
  );
  await assert.rejects(() => agent.sendMessage("Keep going"), ToolTurnLimitExceededError);
  assert.equal(requestCount, 2);
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
