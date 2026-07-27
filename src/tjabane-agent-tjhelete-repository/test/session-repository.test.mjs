import assert from "node:assert/strict";
import { test } from "node:test";
import { SessionRepository } from "../dist/index.js";
import { InMemoryDatabaseClient } from "./utils/in-memory-database-client.mjs";

test("findById maps a stored session record to an application session", async () => {
  const databaseClient = new InMemoryDatabaseClient({
    sessions: [
      {
        id: "session-1",
        userId: "user-1",
        history: [{ role: "user", content: "How much did I spend today?" }],
      },
    ],
  });
  const repository = new SessionRepository(databaseClient);

  const session = await repository.findById("session-1");

  assert.deepEqual(session, {
    id: "session-1",
    userId: "user-1",
    history: [{ role: "user", content: "How much did I spend today?" }],
  });
});

test("findByUserId reads from the configured collection", async () => {
  const databaseClient = new InMemoryDatabaseClient({
    chatSessions: [
      {
        id: "session-2",
        userId: "user-2",
        history: [{ role: "assistant", content: "You are within budget." }],
      },
    ],
    sessions: [
      {
        id: "wrong-session",
        userId: "user-2",
        history: [{ role: "assistant", content: "Wrong collection." }],
      },
    ],
  });
  const repository = new SessionRepository(databaseClient, "chatSessions");

  const session = await repository.findByUserId("user-2");

  assert.equal(session?.id, "session-2");
});

test("save maps an application session to a database record", async () => {
  const databaseClient = new InMemoryDatabaseClient();
  const repository = new SessionRepository(databaseClient);

  await repository.save({
    id: "session-3",
    userId: "user-3",
    history: [
      { role: "user", content: "List recent transactions" },
      {
        role: "tool",
        content: '{"count":3}',
        name: "list_transactions",
        toolCallId: "tool-call-1",
      },
    ],
  });

  assert.deepEqual(databaseClient.getRecord("sessions", "session-3"), {
    id: "session-3",
    userId: "user-3",
    history: [
      { role: "user", content: "List recent transactions" },
      {
        role: "tool",
        content: '{"count":3}',
        name: "list_transactions",
        toolCallId: "tool-call-1",
      },
    ],
  });
});

test("save and reload preserve assistant tool calls", async () => {
  const databaseClient = new InMemoryDatabaseClient();
  const repository = new SessionRepository(databaseClient);
  const session = {
    id: "session-tool-call",
    userId: "user-tool-call",
    history: [
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
        content: '{"total":120}',
        name: "get_spending_summary",
        toolCallId: "call-1",
      },
    ],
  };

  await repository.save(session);
  const reloadedSession = await repository.findById(session.id);

  assert.deepEqual(reloadedSession, session);
});

test("saved records are isolated from caller mutation", async () => {
  const databaseClient = new InMemoryDatabaseClient();
  const repository = new SessionRepository(databaseClient);
  const session = {
    id: "session-5",
    userId: "user-5",
    history: [{ role: "user", content: "Original message" }],
  };

  await repository.save(session);
  session.history[0].content = "Mutated message";

  assert.deepEqual(databaseClient.getRecord("sessions", "session-5"), {
    id: "session-5",
    userId: "user-5",
    history: [{ role: "user", content: "Original message" }],
  });
});

test("delete removes the record from storage", async () => {
  const databaseClient = new InMemoryDatabaseClient({
    sessions: [
      {
        id: "session-4",
        userId: "user-4",
        history: [],
      },
    ],
  });
  const repository = new SessionRepository(databaseClient);

  await repository.delete("session-4");

  assert.equal(databaseClient.getRecord("sessions", "session-4"), null);
});

test("findById returns an isolated copy of the stored session", async () => {
  const databaseClient = new InMemoryDatabaseClient({
    sessions: [
      {
        id: "session-6",
        userId: "user-6",
        history: [{ role: "user", content: "Stored message" }],
      },
    ],
  });
  const repository = new SessionRepository(databaseClient);

  const session = await repository.findById("session-6");
  session.history[0].content = "Mutated message";

  assert.deepEqual(databaseClient.getRecord("sessions", "session-6"), {
    id: "session-6",
    userId: "user-6",
    history: [{ role: "user", content: "Stored message" }],
  });
});
