import assert from "node:assert/strict";
import { test } from "node:test";
import { DefaultInboundMessageService } from "../dist/application/default-inbound-message-service.js";
import { DefaultSessionResolver } from "../dist/application/default-session-resolver.js";
import { DatabaseInboundMessageRepository } from "../dist/infrastructure/database-inbound-message-repository.js";
import { ForbiddenSenderError } from "../dist/errors/forbidden-sender-error.js";

test("a duplicate MessageSid returns the cached reply without another agent run", async () => {
  const database = new MemoryDatabase();
  const inbox = new DatabaseInboundMessageRepository(database);
  let orchestrationCount = 0;
  const service = createService(inbox, {
    async sendMessage() {
      orchestrationCount += 1;
      return "Account reply";
    },
  });

  assert.equal(await service.handle(message("SMduplicate")), "Account reply");
  assert.equal(await service.handle(message("SMduplicate")), "Account reply");
  assert.equal(orchestrationCount, 1);
});

test("overlapping messages for one user are serialized", async () => {
  const database = new MemoryDatabase();
  const inbox = new DatabaseInboundMessageRepository(database);
  let activeRuns = 0;
  let maximumActiveRuns = 0;
  const service = createService(inbox, {
    async sendMessage(_sessionId, text) {
      activeRuns += 1;
      maximumActiveRuns = Math.max(maximumActiveRuns, activeRuns);
      await new Promise((resolve) => globalThis.setTimeout(resolve, 5));
      activeRuns -= 1;
      return `Reply: ${text}`;
    },
  });

  const replies = await Promise.all([
    service.handle(message("SMoverlap1", "first")),
    service.handle(message("SMoverlap2", "second")),
  ]);

  assert.deepEqual(replies, ["Reply: first", "Reply: second"]);
  assert.equal(maximumActiveRuns, 1);
});

test("a first message creates exactly one session", async () => {
  let storedSession = null;
  let createCount = 0;
  const sessionResolver = new DefaultSessionResolver(
    {
      async findByUserId() {
        return storedSession;
      },
      async create(session) {
        createCount += 1;
        storedSession = session;
        return true;
      },
    },
    [{ role: "system", content: "System prompt" }],
    () => "session-created",
  );

  const first = await sessionResolver.getOrCreateForUser("user-1");
  const second = await sessionResolver.getOrCreateForUser("user-1");

  assert.equal(createCount, 1);
  assert.equal(first, second);
  assert.deepEqual(first, {
    id: "session-created",
    userId: "user-1",
    history: [{ role: "system", content: "System prompt" }],
  });
});

test("an unknown sender cannot resolve a session or invoke the agent", async () => {
  const inbox = new DatabaseInboundMessageRepository(new MemoryDatabase());
  let sessionResolutionCount = 0;
  let orchestrationCount = 0;
  const service = new DefaultInboundMessageService(
    inbox,
    {
      async resolve() {
        return null;
      },
    },
    {
      async getOrCreateForUser() {
        sessionResolutionCount += 1;
        throw new Error("must not run");
      },
    },
    {
      async sendMessage() {
        orchestrationCount += 1;
        throw new Error("must not run");
      },
    },
  );

  await assert.rejects(() => service.handle(message("SMunknown")), ForbiddenSenderError);
  assert.equal(sessionResolutionCount, 0);
  assert.equal(orchestrationCount, 0);
});

function createService(inbox, orchestrator) {
  return new DefaultInboundMessageService(
    inbox,
    {
      async resolve() {
        return "user-1";
      },
    },
    {
      async getOrCreateForUser() {
        return { id: "session-1", userId: "user-1", history: [] };
      },
    },
    orchestrator,
  );
}

function message(providerMessageId, text = "hello") {
  return {
    channel: "whatsapp",
    providerMessageId,
    externalSenderId: "whatsapp:+27000000000",
    externalRecipientId: "whatsapp:+27111111111",
    text,
  };
}

class MemoryDatabase {
  records = new Map();
  nextVersion = 1;

  async findById(collectionName, id) {
    const record = this.records.get(`${collectionName}:${id}`);
    return record === undefined ? null : globalThis.structuredClone(record);
  }

  async findOne() {
    return null;
  }

  async create(collectionName, record) {
    const key = `${collectionName}:${record.id}`;

    if (this.records.has(key)) {
      return false;
    }

    this.records.set(key, {
      ...globalThis.structuredClone(record),
      version: String(this.nextVersion++),
    });
    return true;
  }

  async save(collectionName, record, expectedVersion) {
    const key = `${collectionName}:${record.id}`;
    const existing = this.records.get(key);

    if (expectedVersion !== undefined && existing?.version !== expectedVersion) {
      throw new Error("concurrency conflict");
    }

    this.records.set(key, {
      ...globalThis.structuredClone(record),
      version: String(this.nextVersion++),
    });
  }

  async delete(collectionName, id) {
    this.records.delete(`${collectionName}:${id}`);
  }
}
