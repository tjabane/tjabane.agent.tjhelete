import assert from "node:assert/strict";
import { test } from "node:test";
import { SessionRepository } from "../dist/index.js";

test("findById maps a stored session record to an application session", async () => {
  const databaseClient = new FakeDatabaseClient([
    {
      id: "session-1",
      userId: "user-1",
      history: [{ role: "user", content: "How much did I spend today?" }],
    },
  ]);
  const repository = new SessionRepository(databaseClient);

  const session = await repository.findById("session-1");

  assert.deepEqual(session, {
    id: "session-1",
    userId: "user-1",
    history: [{ role: "user", content: "How much did I spend today?" }],
  });
});

test("findByUserId queries the configured collection by userId", async () => {
  const databaseClient = new FakeDatabaseClient([
    {
      id: "session-2",
      userId: "user-2",
      history: [{ role: "assistant", content: "You are within budget." }],
    },
  ]);
  const repository = new SessionRepository(databaseClient, "chatSessions");

  const session = await repository.findByUserId("user-2");

  assert.equal(databaseClient.lastFindOne.collectionName, "chatSessions");
  assert.deepEqual(databaseClient.lastFindOne.query, { userId: "user-2" });
  assert.equal(session.id, "session-2");
});

test("save maps an application session to a database record", async () => {
  const databaseClient = new FakeDatabaseClient();
  const repository = new SessionRepository(databaseClient);

  await repository.save({
    id: "session-3",
    userId: "user-3",
    history: [
      { role: "user", content: "List recent transactions" },
      {
        role: "tool",
        content: "{\"count\":3}",
        name: "list_transactions",
        toolCallId: "tool-call-1",
      },
    ],
  });

  assert.deepEqual(databaseClient.savedRecords, [
    {
      collectionName: "sessions",
      record: {
        id: "session-3",
        userId: "user-3",
        history: [
          { role: "user", content: "List recent transactions" },
          {
            role: "tool",
            content: "{\"count\":3}",
            name: "list_transactions",
            toolCallId: "tool-call-1",
          },
        ],
      },
    },
  ]);
});

test("delete delegates to the database client", async () => {
  const databaseClient = new FakeDatabaseClient();
  const repository = new SessionRepository(databaseClient);

  await repository.delete("session-4");

  assert.deepEqual(databaseClient.deletedRecords, [
    { collectionName: "sessions", id: "session-4" },
  ]);
});

class FakeDatabaseClient {
  records;
  savedRecords = [];
  deletedRecords = [];
  lastFindOne = null;

  constructor(records = []) {
    this.records = records;
  }

  async findById(collectionName, id) {
    return this.records.find((record) => record.id === id) ?? null;
  }

  async findOne(collectionName, query) {
    this.lastFindOne = { collectionName, query };

    return (
      this.records.find((record) =>
        Object.entries(query).every(([key, value]) => record[key] === value),
      ) ?? null
    );
  }

  async save(collectionName, record) {
    this.savedRecords.push({ collectionName, record });
  }

  async delete(collectionName, id) {
    this.deletedRecords.push({ collectionName, id });
  }
}
