import assert from "node:assert/strict";
import { test } from "node:test";
import { CosmosDatabaseClient } from "../dist/index.js";

test("findById reads an item from the configured database and collection", async () => {
  const container = new FakeCosmosContainer({
    records: [
      {
        id: "session-1",
        userId: "user-1",
        history: [],
      },
    ],
  });
  const cosmosClient = new FakeCosmosClient({ sessions: container });
  const databaseClient = new CosmosDatabaseClient(cosmosClient, "agent-db");

  const record = await databaseClient.findById("sessions", "session-1");

  assert.deepEqual(record, {
    id: "session-1",
    userId: "user-1",
    history: [],
  });
  assert.deepEqual(cosmosClient.requestedDatabases, ["agent-db"]);
  assert.deepEqual(container.itemCalls, [{ id: "session-1", partitionKeyValue: "session-1" }]);
});

test("findById returns null when Cosmos returns not found", async () => {
  const databaseClient = new CosmosDatabaseClient(
    new FakeCosmosClient({ sessions: new FakeCosmosContainer() }),
    "agent-db",
  );

  const record = await databaseClient.findById("sessions", "missing-session");

  assert.equal(record, null);
});

test("findById exposes the Cosmos ETag as an opaque version", async () => {
  const container = new FakeCosmosContainer({
    records: [{ id: "versioned", userId: "user", history: [], _etag: "etag-1" }],
  });
  const databaseClient = new CosmosDatabaseClient(
    new FakeCosmosClient({ sessions: container }),
    "agent-db",
  );

  assert.deepEqual(await databaseClient.findById("sessions", "versioned"), {
    id: "versioned",
    userId: "user",
    history: [],
    version: "etag-1",
  });
});

test("findOne uses a parameterized single-record query", async () => {
  const container = new FakeCosmosContainer({
    queryResults: [{ id: "session-2", userId: "user-2", history: [] }],
  });
  const databaseClient = new CosmosDatabaseClient(
    new FakeCosmosClient({ sessions: container }),
    "agent-db",
  );

  const record = await databaseClient.findOne("sessions", {
    userId: "user-2",
    active: true,
  });

  assert.equal(record.id, "session-2");
  assert.deepEqual(container.queryCalls, [
    {
      query: {
        query: "SELECT TOP 1 * FROM c WHERE c.userId = @value0 AND c.active = @value1",
        parameters: [
          { name: "@value0", value: "user-2" },
          { name: "@value1", value: true },
        ],
      },
    },
  ]);
});

test("findOne rejects unsupported query field names", async () => {
  const databaseClient = new CosmosDatabaseClient(
    new FakeCosmosClient({ sessions: new FakeCosmosContainer() }),
    "agent-db",
  );

  await assert.rejects(
    () => databaseClient.findOne("sessions", { "user-id": "user-3" }),
    /not supported/,
  );
});

test("save upserts the record into the collection", async () => {
  const container = new FakeCosmosContainer();
  const databaseClient = new CosmosDatabaseClient(
    new FakeCosmosClient({ sessions: container }),
    "agent-db",
  );

  await databaseClient.save("sessions", {
    id: "session-4",
    userId: "user-4",
    history: [],
  });

  assert.deepEqual(container.upsertedRecords, [
    {
      id: "session-4",
      userId: "user-4",
      history: [],
    },
  ]);
});

test("create atomically rejects an existing record", async () => {
  const container = new FakeCosmosContainer({ records: [{ id: "existing" }] });
  const databaseClient = new CosmosDatabaseClient(
    new FakeCosmosClient({ inbox: container }),
    "agent-db",
  );

  assert.equal(await databaseClient.create("inbox", { id: "new" }), true);
  assert.equal(await databaseClient.create("inbox", { id: "existing" }), false);
});

test("save uses an ETag condition and does not persist the opaque version", async () => {
  const container = new FakeCosmosContainer({
    records: [{ id: "session-versioned", _etag: "etag-1" }],
  });
  const databaseClient = new CosmosDatabaseClient(
    new FakeCosmosClient({ sessions: container }),
    "agent-db",
  );

  await databaseClient.save(
    "sessions",
    { id: "session-versioned", version: "etag-1", value: "updated" },
    "etag-1",
  );

  assert.deepEqual(container.replacedRecords, [
    {
      record: { id: "session-versioned", value: "updated" },
      options: { accessCondition: { type: "IfMatch", condition: "etag-1" } },
    },
  ]);
});

test("delete deletes with the resolved partition key", async () => {
  const container = new FakeCosmosContainer({
    records: [{ id: "session-5", userId: "user-5", history: [] }],
  });
  const databaseClient = new CosmosDatabaseClient(
    new FakeCosmosClient({ sessions: container }),
    "agent-db",
    {
      partitionKeyValueForId: (collectionName, id) => `${collectionName}-${id}-partition`,
    },
  );

  await databaseClient.delete("sessions", "session-5");

  assert.deepEqual(container.itemCalls, [
    {
      id: "session-5",
      partitionKeyValue: "sessions-session-5-partition",
    },
  ]);
  assert.equal(container.records.has("session-5"), false);
});

test("delete treats not found as already deleted", async () => {
  const databaseClient = new CosmosDatabaseClient(
    new FakeCosmosClient({ sessions: new FakeCosmosContainer() }),
    "agent-db",
  );

  await databaseClient.delete("sessions", "missing-session");
});

class FakeCosmosClient {
  requestedDatabases = [];

  constructor(containersByName) {
    this.containersByName = containersByName;
  }

  database(databaseName) {
    this.requestedDatabases.push(databaseName);

    return {
      container: (containerName) => this.containersByName[containerName],
    };
  }
}

class FakeCosmosContainer {
  records = new Map();
  itemCalls = [];
  queryCalls = [];
  upsertedRecords = [];
  replacedRecords = [];

  constructor({ records = [], queryResults = [] } = {}) {
    this.queryResults = queryResults;

    for (const record of records) {
      this.records.set(record.id, cloneRecord(record));
    }

    this.items = {
      query: (query) => {
        this.queryCalls.push({ query });

        return {
          fetchAll: async () => ({
            resources: this.queryResults.map(cloneRecord),
          }),
        };
      },
      upsert: async (record) => {
        this.upsertedRecords.push(cloneRecord(record));
        this.records.set(record.id, cloneRecord(record));
      },
      create: async (record) => {
        if (this.records.has(record.id)) {
          throw { code: 409 };
        }

        this.records.set(record.id, cloneRecord(record));
      },
    };
  }

  item(id, partitionKeyValue) {
    this.itemCalls.push({ id, partitionKeyValue });

    return {
      read: async () => {
        const record = this.records.get(id);

        if (record === undefined) {
          throw { code: 404 };
        }

        return { resource: cloneRecord(record) };
      },
      delete: async () => {
        if (!this.records.has(id)) {
          throw { code: 404 };
        }

        this.records.delete(id);
      },
      replace: async (record, options) => {
        this.replacedRecords.push({
          record: cloneRecord(record),
          options: cloneRecord(options),
        });
        this.records.set(id, cloneRecord(record));
      },
    };
  }
}

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record));
}
