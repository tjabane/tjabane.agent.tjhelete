import assert from "node:assert/strict";
import { test } from "node:test";
import { DefaultToolRegistry } from "../dist/index.js";

const context = {
  userId: "user-1",
  sessionId: "session-1",
  timezone: "Africa/Johannesburg",
  now: new Date("2026-08-01T10:00:00.000Z"),
};

test("tool registry exposes definitions and dispatches by exact name", async () => {
  const executions = [];
  const tool = {
    definition: {
      name: "example_tool",
      description: "Example.",
      inputSchema: { type: "object" },
    },
    async execute(receivedContext, arguments_) {
      executions.push({ receivedContext, arguments_ });
      return { ok: true, data: { value: 42 } };
    },
  };
  const registry = new DefaultToolRegistry([tool]);

  assert.deepEqual(registry.getDefinitions(), [tool.definition]);
  assert.deepEqual(await registry.execute("example_tool", context, { input: true }), {
    ok: true,
    data: { value: 42 },
  });
  assert.deepEqual(executions, [{ receivedContext: context, arguments_: { input: true } }]);
});

test("tool registry rejects duplicate names during construction", () => {
  const tool = {
    definition: { name: "duplicate", description: "Duplicate.", inputSchema: {} },
    async execute() {
      return { ok: true, data: {} };
    },
  };

  assert.throws(() => new DefaultToolRegistry([tool, tool]), /Duplicate tool name "duplicate"/);
});

test("tool registry returns a controlled failure for an unknown exact name", async () => {
  const registry = new DefaultToolRegistry([]);

  assert.deepEqual(await registry.execute("missing", context, {}), {
    ok: false,
    error: {
      code: "unknown_tool",
      message: 'The requested tool "missing" is not available.',
      retryable: false,
    },
  });
});
